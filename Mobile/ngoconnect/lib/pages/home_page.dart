import 'dart:io';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:record/record.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:path_provider/path_provider.dart';
import 'package:video_thumbnail/video_thumbnail.dart';
import 'package:video_player/video_player.dart';
import 'package:audioplayers/audioplayers.dart';
import '../components/main/titlebar.dart';
import '../components/main/history_card.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  // This state variable controls whether the recording layer is open or not
  bool _isRecordingMode = false;

  final ImagePicker _picker = ImagePicker();
  final AudioRecorder _audioRecorder = AudioRecorder();
  bool _isRecordingAudio = false;

  // Stores media: { 'type': 'photo'|'video'|'audio', 'path': String, 'thumbnail': Uint8List? }
  List<Map<String, dynamic>> _mediaFiles = [];

  final ScrollController _thumbnailScrollController = ScrollController();
  Timer? _recordingTimer;
  int _recordingSeconds = 0;
  List<double> _amplitudes = [];
  StreamSubscription<Amplitude>? _amplitudeSubscription;

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_thumbnailScrollController.hasClients) {
        _thumbnailScrollController.animateTo(
          _thumbnailScrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOutCubic,
        );
      }
    });
  }

  @override
  void dispose() {
    _recordingTimer?.cancel();
    _amplitudeSubscription?.cancel();
    _thumbnailScrollController.dispose();
    _audioRecorder.dispose();
    super.dispose();
  }

  Future<void> _takePhoto() async {
    try {
      // image_picker handles camera permissions automatically on most platforms
      final XFile? photo = await _picker.pickImage(source: ImageSource.camera);
      if (photo != null) {
        setState(() {
          _mediaFiles.add({'type': 'photo', 'path': photo.path});
        });
        _scrollToEnd();
      }
    } catch (e) {
      debugPrint('Error taking photo: $e');
    }
  }

  Future<void> _recordVideo() async {
    try {
      // Audio permission might still be needed depending on the platform/plugin,
      // but image_picker usually handles both for video mode.
      final XFile? video = await _picker.pickVideo(source: ImageSource.camera);
      if (video != null) {
        final uint8list = await VideoThumbnail.thumbnailData(
          video: video.path,
          imageFormat: ImageFormat.JPEG,
          maxWidth: 120, // specify the width of the thumbnail
          quality: 25,
        );
        setState(() {
          _mediaFiles.add({
            'type': 'video',
            'path': video.path,
            'thumbnail': uint8list,
          });
        });
        _scrollToEnd();
      }
    } catch (e) {
      debugPrint('Error recording video: $e');
    }
  }

  Future<void> _toggleAudioRecording() async {
    try {
      if (_isRecordingAudio) {
        _recordingTimer?.cancel();
        _amplitudeSubscription?.cancel();
        final path = await _audioRecorder.stop();
        if (path != null) {
          setState(() {
            _isRecordingAudio = false;
            _mediaFiles.add({'type': 'audio', 'path': path});
          });
          _scrollToEnd();
        }
      } else {
        if (await _audioRecorder.hasPermission()) {
          final directory = await getApplicationDocumentsDirectory();
          final path =
              '${directory.path}/audio_${DateTime.now().millisecondsSinceEpoch}.m4a';
          await _audioRecorder.start(const RecordConfig(), path: path);

          _recordingSeconds = 0;
          _amplitudes = [];

          _recordingTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
            setState(() {
              _recordingSeconds++;
            });
          });

          _amplitudeSubscription = _audioRecorder
              .onAmplitudeChanged(const Duration(milliseconds: 100))
              .listen((amp) {
                setState(() {
                  _amplitudes.add(amp.current);
                  if (_amplitudes.length > 30) _amplitudes.removeAt(0);
                });
              });

          setState(() {
            _isRecordingAudio = true;
          });
        } else {
          debugPrint('Microphone permission not granted');
        }
      }
    } catch (e) {
      debugPrint('Error recording audio: $e');
    }
  }

  void _toggleRecordingMode() {
    setState(() {
      _isRecordingMode = !_isRecordingMode;
    });
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    // Top layer takes 60%, Bottom layer takes 40%
    final topLayerHeight = size.height * 0.6;
    final bottomLayerHeight = size.height * 0.4;

    // Variables for the normal state "New Recording" button
    const double padding = 20.0;
    const double buttonHeight = 60.0;

    return Scaffold(
      backgroundColor: Colors.white,
      extendBodyBehindAppBar: true,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(100.0),
        child: AnimatedOpacity(
          duration: const Duration(milliseconds: 250),
          opacity: _isRecordingMode ? 0.0 : 1.0,
          child: const MainTitleBar(),
        ),
      ),
      body: SizedBox.expand(
        child: Stack(
          children: [
            // ---------------------------------------------------
            // 1. BASE LAYER: Content
            // ---------------------------------------------------
            // ---------------------------------------------------
            // 2. BASE LAYER: Content (Background)
            // ---------------------------------------------------
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: padding),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 10),
                    Text(
                      "Latest Recordings",
                      style: Theme.of(context).textTheme.headlineLarge
                          ?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.black,
                          ),
                    ),
                    const SizedBox(height: 10),
                    Flexible(
                      fit: FlexFit.loose,
                      child: ConstrainedBox(
                        constraints: BoxConstraints(
                          maxHeight: size.height * 0.7,
                        ),
                        child: Container(
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: const Color(0xFFFAFAFA),
                            borderRadius: BorderRadius.circular(32),
                          ),
                          child: ListView(
                            shrinkWrap: true,
                            // Removed bottom padding from here so Container shrinks correctly
                            padding: const EdgeInsets.only(top: 8, bottom: 8),
                            children: [
                              HistoryCard(
                                title: "Community Outreach",
                                duration: "04:20",
                                photoCount: 3,
                                videoCount: 1,
                                onViewTap: () {},
                              ),
                              HistoryCard(
                                title: "Resource Allocation",
                                duration: "10:15",
                                photoCount: 5,
                                onViewTap: () {},
                              ),
                              HistoryCard(
                                title: "Donation Drive",
                                duration: "02:45",
                                videoCount: 2,
                                onViewTap: () {},
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(
                      height: 180,
                    ), // Space for nav bar + recording button
                  ],
                ),
              ),
            ),

            // ---------------------------------------------------
            // 2. BOTTOM LAYER (Transforms from Button)
            // ---------------------------------------------------
            AnimatedPositioned(
              duration: const Duration(milliseconds: 350),
              curve: Curves.easeOutCubic,
              // If closed: Anchor above bottom nav bar. If open: Snap to absolute bottom
              bottom: _isRecordingMode ? 0 : padding + 85,
              left: _isRecordingMode ? 0 : padding,
              right: _isRecordingMode ? 0 : padding,
              height: _isRecordingMode
                  ? null
                  : buttonHeight, // null height allows it to fit content
              child: GestureDetector(
                onTap: _isRecordingMode ? null : _toggleRecordingMode,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 350),
                  curve: Curves.easeOutCubic,
                  decoration: BoxDecoration(
                    color: const Color(0xFF68417E),
                    borderRadius: _isRecordingMode
                        ? const BorderRadius.vertical(top: Radius.circular(32))
                        : BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.15),
                        blurRadius: 10,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: _isRecordingMode
                        ? const BorderRadius.vertical(top: Radius.circular(32))
                        : BorderRadius.circular(24),
                    child: SingleChildScrollView(
                      physics: const NeverScrollableScrollPhysics(),
                      child: _isRecordingMode
                          ? _buildRecordingBottomUI()
                          : _buildClosedButtonUI(context),
                    ),
                  ),
                ),
              ),
            ),

            // ---------------------------------------------------
            // 3. FLOATING NAV BAR
            // ---------------------------------------------------
            AnimatedPositioned(
              duration: const Duration(milliseconds: 350),
              curve: Curves.easeOutCubic,
              bottom: _isRecordingMode
                  ? -100
                  : padding, // Slide down completely offscreen when recording
              left: padding,
              right: padding,
              height: 70, // Required for proper AnimatedPositioned bounds!
              child: _buildFloatingNavBar(),
            ),

            // ---------------------------------------------------
            // 4. TOP LAYER (Foreground - Highest Z-Index)
            // ---------------------------------------------------
            AnimatedPositioned(
              duration: const Duration(milliseconds: 350),
              curve: Curves.easeOutCubic,
              // When open it drops to top = 0. When closed it slides up completely out of view
              top: _isRecordingMode ? 0 : -topLayerHeight,
              left: 0,
              right: 0,
              height: topLayerHeight,
              child: IgnorePointer(
                ignoring: !_isRecordingMode,
                child: Container(
                  color: Colors.white,
                  child: Column(
                    children: [
                      // 1. Thumbnail Area (Top) with top margin for safe area
                      Container(
                        height: size.height * 0.25,
                        width: double.infinity,
                        margin: const EdgeInsets.only(
                          top: 60,
                          left: 20,
                          right: 20,
                          bottom: 20,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF5F5F5),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: Colors.black.withOpacity(0.05),
                          ),
                        ),
                        child: _mediaFiles.isEmpty
                            ? const Center(
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.image_outlined,
                                      color: Colors.black26,
                                      size: 40,
                                    ),
                                    SizedBox(height: 8),
                                    Text(
                                      "No Media Yet",
                                      style: TextStyle(color: Colors.black26),
                                    ),
                                  ],
                                ),
                              )
                            : ListView.builder(
                                controller: _thumbnailScrollController,
                                scrollDirection: Axis.horizontal,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 16,
                                ),
                                itemCount: _mediaFiles.length,
                                itemBuilder: (context, index) {
                                  final media = _mediaFiles[index];
                                  return _buildMediaThumbnail(
                                    index,
                                    media,
                                    key: ValueKey(media['path']),
                                  );
                                },
                              ),
                      ),

                      // 2. Transcription Area with Gradient Fade
                      Expanded(
                        child: Stack(
                          children: [
                            Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 24,
                              ),
                              child: ListView(
                                padding: const EdgeInsets.only(bottom: 60),
                                children: [
                                  Text(
                                    "Transcription",
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleSmall
                                        ?.copyWith(
                                          fontWeight: FontWeight.bold,
                                          color: Colors.black38,
                                          letterSpacing: 1.2,
                                        ),
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    "The community outreach program successfully identified three new areas for resource allocation. Initial assessments show a high demand for educational materials and healthcare supplies. The local NGO representatives confirmed that the donation drive will begin early next week to address these needs...",
                                    style: Theme.of(context).textTheme.bodyLarge
                                        ?.copyWith(
                                          height: 1.6,
                                          color: Colors.black87,
                                        ),
                                  ),
                                ],
                              ),
                            ),
                            // Bottom Fade Effect (Gradient)
                            Positioned(
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: 60,
                              child: Container(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                    colors: [
                                      Colors.white.withOpacity(0),
                                      Colors.white,
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ), // Closes Stack
      ), // Closes SizedBox.expand
    ); // Closes Scaffold
  }

  //ok
  void _confirmDelete(Map<String, dynamic> media) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text("Delete Media"),
          content: const Text("Are you sure you want to delete this file?"),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text("Cancel"),
            ),
            TextButton(
              onPressed: () {
                debugPrint('Attempting to delete media: ${media['path']}');
                try {
                  setState(() {
                    final initialCount = _mediaFiles.length;
                    // Remove all occurrences by path just in case
                    _mediaFiles.removeWhere(
                      (item) => item['path'] == media['path'],
                    );
                    // Create a new list to ensure rebuilds
                    _mediaFiles = List.from(_mediaFiles);
                    debugPrint(
                      'Deleted. Initial count: $initialCount, New count: ${_mediaFiles.length}',
                    );
                  });
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Media removed.'),
                      duration: Duration(seconds: 1),
                    ),
                  );
                } catch (e) {
                  debugPrint('Error deleting: $e');
                }
                // Pop the confirmation dialog
                Navigator.of(context).pop();
                // Additionally pop the preview dialog if it was open
                if (Navigator.of(context).canPop()) {
                  Navigator.of(context).pop();
                }
              },
              child: const Text(
                "Delete",
                style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  void _previewMedia(Map<String, dynamic> media) {
    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.all(20),
          child: Stack(
            alignment: Alignment.center,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: MediaPreviewPlayer(media: media),
              ),
              Positioned(
                bottom: 20,
                child: ElevatedButton(
                  onPressed: () => _confirmDelete(media),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.redAccent,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.delete_outline, size: 20),
                      SizedBox(width: 8),
                      Text(
                        "Delete Media",
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
              Positioned(
                top: 0,
                right: 0,
                child: IconButton(
                  icon: const Icon(Icons.cancel, color: Colors.white, size: 36),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMediaThumbnail(
    int index,
    Map<String, dynamic> media, {
    Key? key,
  }) {
    Widget content;
    if (media['type'] == 'photo') {
      content = Image.file(File(media['path']), fit: BoxFit.cover);
    } else if (media['type'] == 'video') {
      content = Stack(
        fit: StackFit.expand,
        children: [
          if (media['thumbnail'] != null)
            Image.memory(media['thumbnail'], fit: BoxFit.cover),
          Container(color: Colors.black26), // Dark overlay
          const Center(
            child: Icon(Icons.play_circle_fill, color: Colors.white, size: 32),
          ),
        ],
      );
    } else if (media['type'] == 'audio') {
      content = const Center(
        child: Icon(Icons.audiotrack, color: Colors.black54, size: 32),
      );
    } else {
      content = const Center(child: Icon(Icons.file_present));
    }

    return Padding(
      key: key,
      padding: const EdgeInsets.only(right: 12),
      child: AspectRatio(
        aspectRatio: 1.0,
        child: Stack(
          fit: StackFit.expand,
          children: [
            GestureDetector(
              onTap: () => _previewMedia(media),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.04),
                  borderRadius: BorderRadius.circular(16),
                ),
                clipBehavior: Clip.antiAlias,
                child: content,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // The small state: The Button content
  Widget _buildClosedButtonUI(BuildContext context) {
    return SizedBox(
      height: 60, // Fixed height for the closed button state
      child: Center(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.mic_none_rounded, color: Colors.white),
            const SizedBox(width: 8),
            Text(
              "New Recording",
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // The expanded state: Action Sheet that fits content
  Widget _buildRecordingBottomUI() {
    return Column(
      mainAxisSize: MainAxisSize.min, // Important: Fits content
      children: [
        // Aesthetic drag handle indicator
        Container(
          margin: const EdgeInsets.only(top: 12, bottom: 20),
          height: 5,
          width: 40,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.3),
            borderRadius: BorderRadius.circular(10),
          ),
        ),

        if (_isRecordingAudio)
          Container(
            height: 40,
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 24),
            margin: const EdgeInsets.only(bottom: 20),
            child: Row(
              children: [
                Text(
                  '${(_recordingSeconds ~/ 60).toString().padLeft(2, '0')}:${(_recordingSeconds % 60).toString().padLeft(2, '0')}',
                  style: const TextStyle(
                    color: Colors.redAccent,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(width: 16), // Space between time and lines
                Expanded(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: _amplitudes.map((amp) {
                      double height = ((amp + 50) / 50 * 35);
                      if (height < 5) height = 5;
                      if (height > 35) height = 35;
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 100),
                        margin: const EdgeInsets.only(left: 3),
                        width: 4,
                        height: height,
                        decoration: BoxDecoration(
                          color: Colors.redAccent.withOpacity(0.8),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),

        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              Expanded(
                child: _buildActionButton(
                  icon: Icons.videocam_outlined,
                  label: "Video",
                  onTap: _recordVideo,
                ),
              ),
              Expanded(
                child: _buildActionButton(
                  icon: _isRecordingAudio
                      ? Icons.stop_circle_outlined
                      : Icons.mic_none_rounded,
                  label: _isRecordingAudio ? "Stop" : "Voice",
                  iconColor: _isRecordingAudio ? Colors.red : Colors.white,
                  onTap: _toggleAudioRecording,
                ),
              ),
              Expanded(
                child: _buildActionButton(
                  icon: Icons.camera_alt_outlined,
                  label: "Photo",
                  onTap: _takePhoto,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // Submit for Review Button
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: SizedBox(
            width: double.infinity,
            height: 55,
            child: ElevatedButton(
              onPressed: () {
                // TODO: Submit review logic
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF68417E),
                elevation: 0,
                shape: ContinuousRectangleBorder(
                  borderRadius: BorderRadius.circular(32),
                ),
              ),
              child: const Text(
                "Submit for Review",
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ),

        const SizedBox(height: 12),

        // Cancel/Close Button
        Padding(
          padding: const EdgeInsets.only(left: 20, right: 20, bottom: 40),
          child: SizedBox(
            width: double.infinity,
            height: 55,
            child: OutlinedButton(
              onPressed: _toggleRecordingMode,
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: const BorderSide(color: Colors.white24),
                shape: ContinuousRectangleBorder(
                  borderRadius: BorderRadius.circular(32),
                ),
              ),
              child: const Text(
                "Cancel",
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    Color? iconColor,
  }) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
            ),
            child: Icon(icon, color: iconColor ?? Colors.white, size: 28),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  // Floating Navigation Bar UI
  Widget _buildFloatingNavBar() {
    return Container(
      height: 70,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(35),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _buildNavItem(Icons.home_rounded, "Home", true),
          _buildNavItem(Icons.notifications_none_rounded, "Alerts", false),
          _buildNavItem(Icons.history_rounded, "History", false),
          _buildNavItem(Icons.person_outline_rounded, "Profile", false),
        ],
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label, bool isSelected) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          color: isSelected ? const Color(0xFF68417E) : Colors.black38,
          size: 26, // Slightly larger icon for tap area
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: isSelected ? const Color(0xFF68417E) : Colors.black38,
            fontSize: 10,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class MediaPreviewPlayer extends StatefulWidget {
  final Map<String, dynamic> media;
  const MediaPreviewPlayer({super.key, required this.media});

  @override
  State<MediaPreviewPlayer> createState() => _MediaPreviewPlayerState();
}

class _MediaPreviewPlayerState extends State<MediaPreviewPlayer> {
  VideoPlayerController? _videoController;
  final AudioPlayer _audioPlayer = AudioPlayer();
  bool _isPlaying = false;

  @override
  void initState() {
    super.initState();
    if (widget.media['type'] == 'video') {
      _videoController = VideoPlayerController.file(File(widget.media['path']))
        ..initialize().then((_) {
          setState(() {});
          _videoController!.play();
          _isPlaying = true;
        });
      _videoController!.addListener(() {
        if (!mounted) return;
        setState(() {
          _isPlaying = _videoController!.value.isPlaying;
        });
      });
    } else if (widget.media['type'] == 'audio') {
      _audioPlayer.play(DeviceFileSource(widget.media['path']));
      _isPlaying = true;

      _audioPlayer.onPlayerStateChanged.listen((state) {
        if (!mounted) return;
        setState(() {
          _isPlaying = state == PlayerState.playing;
        });
      });
    }
  }

  @override
  void dispose() {
    _videoController?.dispose();
    _audioPlayer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.media['type'] == 'photo') {
      return InteractiveViewer(child: Image.file(File(widget.media['path'])));
    } else if (widget.media['type'] == 'video') {
      return _videoController != null && _videoController!.value.isInitialized
          ? AspectRatio(
              aspectRatio: _videoController!.value.aspectRatio,
              child: Stack(
                alignment: Alignment.bottomCenter,
                children: [
                  GestureDetector(
                    onTap: () {
                      if (_videoController!.value.isPlaying) {
                        _videoController!.pause();
                      } else {
                        _videoController!.play();
                      }
                    },
                    child: VideoPlayer(_videoController!),
                  ),
                  if (!_isPlaying)
                    const Center(
                      child: Icon(
                        Icons.play_circle_fill,
                        color: Colors.white54,
                        size: 64,
                      ),
                    ),
                  VideoProgressIndicator(
                    _videoController!,
                    allowScrubbing: true,
                  ),
                ],
              ),
            )
          : const SizedBox(
              height: 200,
              child: Center(
                child: CircularProgressIndicator(color: Colors.white),
              ),
            );
    } else if (widget.media['type'] == 'audio') {
      return Container(
        width: double.infinity,
        height: 200,
        color: Colors.black87,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.audiotrack, size: 64, color: Colors.white),
            const SizedBox(height: 20),
            IconButton(
              icon: Icon(
                _isPlaying
                    ? Icons.pause_circle_filled
                    : Icons.play_circle_filled,
              ),
              color: Colors.white,
              iconSize: 48,
              onPressed: () {
                if (_isPlaying) {
                  _audioPlayer.pause();
                } else {
                  _audioPlayer.resume();
                }
              },
            ),
          ],
        ),
      );
    }
    return const SizedBox.shrink();
  }
}

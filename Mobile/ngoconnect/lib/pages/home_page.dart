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
import '../components/main/floating_nav_bar.dart';
import '../components/recording/media_preview_player.dart';
import '../components/recording/media_thumbnail.dart';
import '../components/recording/recording_action_sheet.dart';
import './profile_page.dart';
import './issues/issues_page.dart';
import './tasks/tasks_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  // This state variable controls whether the recording layer is open or not
  bool _isRecordingMode = false;
  int _currentNavIndex = 0;

  final ImagePicker _picker = ImagePicker();
  final AudioRecorder _audioRecorder = AudioRecorder();
  bool _isRecordingAudio = false;

  List<Map<String, dynamic>> _mediaFiles = [];
  Map<String, dynamic>? _selectedHistoryItem;

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
      if (!_isRecordingMode) {
        _selectedHistoryItem = null;
      }
    });
  }

  void _openHistoryItem(Map<String, dynamic> item) {
    setState(() {
      _selectedHistoryItem = item;
      _isRecordingMode = true;
    });
  }

  void _onNavItemSelected(int index) {
    if (index == 1) {
      // Tasks page
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const TasksPage()),
      ).then((_) {
        setState(() {
          _currentNavIndex = 0;
        });
      });
    } else if (index == 2) {
      // Issues page
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const IssuesPage()),
      ).then((_) {
        setState(() {
          _currentNavIndex = 0;
        });
      });
    } else if (index == 3) {
      // Profile page
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const ProfilePage()),
      ).then((_) {
        setState(() {
          _currentNavIndex = 0;
        });
      });
    }
    setState(() {
      _currentNavIndex = index;
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
                                onViewTap: () => _openHistoryItem({
                                  'title': 'Community Outreach',
                                  'transcription':
                                      'The community outreach program successfully identified three new areas for resource allocation. Initial assessments show a high demand for educational materials and healthcare supplies.',
                                  'media': [
                                    {
                                      'type': 'photo',
                                      'path':
                                          'https://plus.unsplash.com/premium_photo-1683121366410-d8120fc35b81?q=80&w=2940&auto=format&fit=crop',
                                    },
                                    {
                                      'type': 'photo',
                                      'path':
                                          'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2813&auto=format&fit=crop',
                                    },
                                    {
                                      'type': 'video',
                                      'path': 'invalid',
                                      'thumbnail': null,
                                    },
                                  ],
                                }),
                              ),
                              HistoryCard(
                                title: "Resource Allocation",
                                duration: "10:15",
                                photoCount: 5,
                                onViewTap: () => _openHistoryItem({
                                  'title': 'Resource Allocation',
                                  'transcription':
                                      'Analysis of the strategic reserves reveals a need for immediate replenishment of potable water and non-perishable food items in the northern sector.',
                                  'media': [],
                                }),
                              ),
                              HistoryCard(
                                title: "Donation Drive",
                                duration: "02:45",
                                videoCount: 2,
                                onViewTap: () => _openHistoryItem({
                                  'title': 'Donation Drive',
                                  'transcription':
                                      'The donation drive exceeded expectations, collecting over 500 kits of basic necessities. Team is preparing for dispatch tomorrow at 6 AM.',
                                  'media': [],
                                }),
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
                          ? RecordingActionSheet(
                              isRecordingAudio: _isRecordingAudio,
                              recordingSeconds: _recordingSeconds,
                              amplitudes: _amplitudes,
                              onRecordVideo: _recordVideo,
                              onToggleAudioRecording: _toggleAudioRecording,
                              onTakePhoto: _takePhoto,
                              isViewingHistory: _selectedHistoryItem != null,
                              onSubmit: () {
                                // TODO: Submit review logic
                              },
                              onCancel: _toggleRecordingMode,
                            )
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
              child: FloatingNavBar(
                currentIndex: _currentNavIndex,
                onItemSelected: _onNavItemSelected,
              ),
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
                        child:
                            (_selectedHistoryItem != null
                                ? (_selectedHistoryItem!['media'] as List)
                                      .isEmpty
                                : _mediaFiles.isEmpty)
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
                                      "No Media Found",
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
                                itemCount: _selectedHistoryItem != null
                                    ? (_selectedHistoryItem!['media'] as List)
                                          .length
                                    : _mediaFiles.length,
                                itemBuilder: (context, index) {
                                  final media = _selectedHistoryItem != null
                                      ? _selectedHistoryItem!['media'][index]
                                      : _mediaFiles[index];
                                  return Padding(
                                    padding: const EdgeInsets.only(right: 12),
                                    child: MediaThumbnail(
                                      key: ValueKey(media['path']),
                                      media: media,
                                      onTap: () => _previewMedia(media),
                                    ),
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
                                        .titleLarge
                                        ?.copyWith(
                                          fontWeight: FontWeight.w900,
                                          color: Color(0XFF596939),
                                          letterSpacing: 1.2,
                                        ),
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    _selectedHistoryItem != null
                                        ? _selectedHistoryItem!['transcription']
                                        : "The community outreach program successfully identified three new areas for resource allocation. Initial assessments show a high demand for educational materials and healthcare supplies. The local NGO representatives confirmed that the donation drive will begin early next week to address these needs...",
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
}

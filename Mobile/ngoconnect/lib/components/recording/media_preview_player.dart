import 'dart:io';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:audioplayers/audioplayers.dart';

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
    final String path = widget.media['path'];
    final bool isNetwork = path.startsWith('http');

    if (widget.media['type'] == 'video') {
       _videoController = isNetwork
         ? VideoPlayerController.networkUrl(Uri.parse(path))
         : VideoPlayerController.file(File(path));
       
       _videoController!.initialize().then((_) {
         if (!mounted) return;
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
       _audioPlayer.play(isNetwork ? UrlSource(path) : DeviceFileSource(path));
       _isPlaying = true;
       
       _audioPlayer.onPlayerStateChanged.listen((state) {
         if (!mounted) return;
         setState(() { _isPlaying = state == PlayerState.playing; });
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
      final String path = widget.media['path'];
      return InteractiveViewer(
        child: path.startsWith('http')
          ? Image.network(path, fit: BoxFit.contain)
          : Image.file(File(path), fit: BoxFit.contain),
      );
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
                      child: Icon(Icons.play_circle_fill, color: Colors.white54, size: 64),
                    ),
                  VideoProgressIndicator(_videoController!, allowScrubbing: true),
                ]
              ),
            )
          : const SizedBox(
              height: 200, 
              child: Center(child: CircularProgressIndicator(color: Colors.white))
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
              icon: Icon(_isPlaying ? Icons.pause_circle_filled : Icons.play_circle_filled),
              color: Colors.white,
              iconSize: 48,
              onPressed: () {
                if (_isPlaying) {
                  _audioPlayer.pause();
                } else {
                  _audioPlayer.resume();
                }
              },
            )
          ],
        ),
      );
    }
    return const SizedBox.shrink();
  }
}

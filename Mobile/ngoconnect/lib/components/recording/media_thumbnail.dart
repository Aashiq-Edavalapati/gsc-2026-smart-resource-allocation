import 'dart:io';
import 'package:flutter/material.dart';

class MediaThumbnail extends StatelessWidget {
  final Map<String, dynamic> media;
  final VoidCallback onTap;

  const MediaThumbnail({
    super.key,
    required this.media,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Widget content;
    final bool isNetwork = media['path']?.toString().startsWith('http') ?? false;

    if (media['type'] == 'photo') {
      content = isNetwork 
          ? Image.network(media['path'], fit: BoxFit.cover)
          : Image.file(File(media['path']), fit: BoxFit.cover);
    } else if (media['type'] == 'video') {
      content = Stack(
        fit: StackFit.expand,
        children: [
          if (media['thumbnail'] != null)
            Image.memory(media['thumbnail'], fit: BoxFit.cover),
          Container(color: Colors.black26), // Dark overlay
          const Center(child: Icon(Icons.play_circle_fill, color: Colors.white, size: 32)),
        ],
      );
    } else if (media['type'] == 'audio') {
      content = const Center(child: Icon(Icons.audiotrack, color: Colors.black54, size: 32));
    } else {
      content = const Center(child: Icon(Icons.file_present));
    }

    return AspectRatio(
      aspectRatio: 1.0,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.04),
            borderRadius: BorderRadius.circular(16),
          ),
          clipBehavior: Clip.antiAlias,
          child: content,
        ),
      ),
    );
  }
}

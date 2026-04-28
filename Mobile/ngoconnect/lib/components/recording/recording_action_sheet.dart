import 'package:flutter/material.dart';

class RecordingActionSheet extends StatefulWidget {
  final bool isRecordingAudio;
  final int recordingSeconds;
  final List<double> amplitudes;
  final VoidCallback onRecordVideo;
  final VoidCallback onToggleAudioRecording;
  final VoidCallback onTakePhoto;
  final VoidCallback onPickGallery;
  final bool isViewingHistory;
  final VoidCallback onSubmit;
  final VoidCallback onCancel;
  final TextEditingController titleController;

  const RecordingActionSheet({
    super.key,
    required this.isRecordingAudio,
    required this.recordingSeconds,
    required this.amplitudes,
    required this.onRecordVideo,
    required this.onToggleAudioRecording,
    required this.onTakePhoto,
    required this.onPickGallery,
    required this.isViewingHistory,
    required this.onSubmit,
    required this.onCancel,
    required this.titleController,
  });

  @override
  State<RecordingActionSheet> createState() => _RecordingActionSheetState();
}

class _RecordingActionSheetState extends State<RecordingActionSheet> {
  bool _isEditingTitle = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
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

        if (widget.isRecordingAudio && !widget.isViewingHistory)
          Container(
            height: 40,
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 24),
            margin: const EdgeInsets.only(bottom: 20),
            child: Row(
              children: [
                Text(
                  '${(widget.recordingSeconds ~/ 60).toString().padLeft(2, '0')}:${(widget.recordingSeconds % 60).toString().padLeft(2, '0')}',
                  style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: widget.amplitudes.map((amp) {
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

        if (!widget.isViewingHistory)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Expanded(
                  child: _buildActionButton(
                    icon: Icons.videocam_outlined,
                    label: "Video",
                    onTap: widget.onRecordVideo,
                  ),
                ),
                Expanded(
                  child: _buildActionButton(
                    icon: widget.isRecordingAudio ? Icons.stop_circle_outlined : Icons.mic_none_rounded,
                    label: widget.isRecordingAudio ? "Stop" : "Voice",
                    iconColor: widget.isRecordingAudio ? Colors.red : Colors.white,
                    onTap: widget.onToggleAudioRecording,
                  ),
                ),
                Expanded(
                  child: _buildActionButton(
                    icon: Icons.camera_alt_outlined,
                    label: "Photo",
                    onTap: widget.onTakePhoto,
                  ),
                ),
                Expanded(
                  child: _buildActionButton(
                    icon: Icons.photo_library_outlined,
                    label: "Gallery",
                    onTap: widget.onPickGallery,
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
              onPressed: widget.onSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF68417E),
                elevation: 0,
                shape: ContinuousRectangleBorder(
                  borderRadius: BorderRadius.circular(32),
                ),
              ),
              child: Text(
                widget.isViewingHistory ? "Update Recording" : "Submit for Review",
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
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
              onPressed: widget.onCancel,
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
}

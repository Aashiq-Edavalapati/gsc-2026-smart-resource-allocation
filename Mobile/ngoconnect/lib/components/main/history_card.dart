import 'package:flutter/material.dart';
import '../../utils/fonts/app_fonts.dart';

class HistoryCard extends StatelessWidget {
  final String title;
  final String duration;
  final int photoCount;
  final int videoCount;
  final VoidCallback? onViewTap;

  const HistoryCard({
    super.key,
    required this.title,
    required this.duration,
    this.photoCount = 0,
    this.videoCount = 0,
    this.onViewTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF98b65d),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Left Side: Name and Duration + Media Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      duration,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.white.withOpacity(0.9),
                      ),
                    ),
                    if (photoCount > 0 || videoCount > 0) ...[
                      const SizedBox(width: 8),
                      Container(width: 4, height: 4, decoration: const BoxDecoration(color: Colors.white54, shape: BoxShape.circle)),
                      const SizedBox(width: 8),
                    ],
                    if (photoCount > 0)
                      Text(
                        "${photoCount}x photos ",
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70),
                      ),
                    if (videoCount > 0)
                      Text(
                        "${videoCount}x video",
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white70),
                      ),
                  ],
                ),
              ],
            ),
          ),

          // Right Side: View Button
          GestureDetector(
            onTap: onViewTap,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.arrow_outward,
                color: Color(0xFF98b65d),
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

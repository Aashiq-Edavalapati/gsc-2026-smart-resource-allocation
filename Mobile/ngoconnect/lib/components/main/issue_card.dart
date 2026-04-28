import 'package:flutter/material.dart';

class IssueCard extends StatelessWidget {
  final Map<String, dynamic> issue;
  final VoidCallback onTap;

  const IssueCard({
    super.key,
    required this.issue,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final String title = issue['title'] ?? 'No Title';
    final String description = issue['description'] ?? 'No Description';
    final String status = issue['status'] ?? 'OPEN';
    final String category = issue['category'] ?? 'OTHER';
    final int urgency = issue['urgency'] ?? 1;

    Color urgencyColor;
    if (urgency >= 4) {
      urgencyColor = Colors.redAccent;
    } else if (urgency >= 2) {
      urgencyColor = Colors.orangeAccent;
    } else {
      urgencyColor = Colors.blueAccent;
    }

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 15,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: urgencyColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    category,
                    style: TextStyle(
                      color: urgencyColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    status,
                    style: const TextStyle(
                      color: Colors.black45,
                      fontWeight: FontWeight.bold,
                      fontSize: 10,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 14,
                color: Colors.black.withOpacity(0.6),
                height: 1.4,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 16, color: Colors.black38),
                const SizedBox(width: 4),
                Text(
                  issue['city'] ?? 'Unknown Location',
                  style: const TextStyle(color: Colors.black38, fontSize: 13),
                ),
                const Spacer(),
                const Icon(Icons.comment_outlined, size: 16, color: Colors.black38),
                const SizedBox(width: 4),
                Text(
                  "${(issue['comments'] as List?)?.length ?? 0}",
                  style: const TextStyle(color: Colors.black38, fontSize: 13),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

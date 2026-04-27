import 'package:flutter/material.dart';

class TaskCard extends StatelessWidget {
  final Map<String, dynamic> assignment;
  final VoidCallback? onStatusUpdate;

  const TaskCard({
    super.key,
    required this.assignment,
    this.onStatusUpdate,
  });

  @override
  Widget build(BuildContext context) {
    final task = assignment['task'];
    final String title = task?['title'] ?? 'No Title';
    final String status = assignment['status'] ?? 'PENDING';
    final int progress = assignment['progress'] ?? 0;

    Color statusColor;
    switch (status) {
      case 'APPROVED':
        statusColor = Colors.green;
        break;
      case 'COMPLETED':
        statusColor = Colors.blue;
        break;
      case 'REJECTED':
        statusColor = Colors.red;
        break;
      default:
        statusColor = Colors.orange;
    }

    return Container(
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
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 10,
                  ),
                ),
              ),
              if (status == 'APPROVED')
                Text(
                  "$progress%",
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black38),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
          ),
          const SizedBox(height: 8),
          Text(
            task?['description'] ?? '',
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(color: Colors.black.withOpacity(0.6), height: 1.4),
          ),
          if (status == 'APPROVED') ...[
            const SizedBox(height: 16),
            LinearProgressIndicator(
              value: progress / 100,
              backgroundColor: Colors.grey[200],
              color: const Color(0xFF68417E),
              borderRadius: BorderRadius.circular(4),
            ),
          ],
        ],
      ),
    );
  }
}

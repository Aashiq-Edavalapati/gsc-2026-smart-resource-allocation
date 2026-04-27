import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/issue_service.dart';

class IssueDetailsPage extends StatefulWidget {
  final String issueId;
  const IssueDetailsPage({super.key, required this.issueId});

  @override
  State<IssueDetailsPage> createState() => _IssueDetailsPageState();
}

class _IssueDetailsPageState extends State<IssueDetailsPage> {
  final _commentController = TextEditingController();
  Map<String, dynamic>? _issue;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadIssue();
  }

  Future<void> _loadIssue() async {
    final issue = await Provider.of<IssueService>(context, listen: false).getIssueDetails(widget.issueId);
    setState(() {
      _issue = issue;
      _isLoading = false;
    });
  }

  Future<void> _postComment() async {
    if (_commentController.text.trim().isEmpty) return;
    
    final success = await Provider.of<IssueService>(context, listen: false).addComment(
      widget.issueId,
      _commentController.text.trim(),
    );

    if (success) {
      _commentController.clear();
      _loadIssue(); // Refresh to show new comment
    }
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF68417E);

    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: primaryColor)));
    }

    if (_issue == null) {
      return Scaffold(appBar: AppBar(), body: const Center(child: Text("Issue not found")));
    }

    final comments = _issue!['comments'] as List? ?? [];

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(_issue!['title'] ?? "Issue Details", style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                _buildStatusBadge(_issue!['status'] ?? "OPEN"),
                const SizedBox(height: 16),
                Text(
                  _issue!['title'] ?? "",
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                Text(
                  _issue!['description'] ?? "",
                  style: const TextStyle(fontSize: 16, color: Colors.black87, height: 1.5),
                ),
                const SizedBox(height: 24),
                const Divider(),
                const SizedBox(height: 24),
                const Text("COMMENTS", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.black26, letterSpacing: 1.1)),
                const SizedBox(height: 16),
                if (comments.isEmpty)
                  const Text("No comments yet. Be the first to respond!", style: TextStyle(color: Colors.black38, fontStyle: FontStyle.italic)),
                ...comments.map((c) => _buildCommentTile(c)).toList(),
              ],
            ),
          ),
          _buildCommentInput(),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFF68417E).withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status,
        style: const TextStyle(color: Color(0xFF68417E), fontWeight: FontWeight.bold, fontSize: 12),
      ),
    );
  }

  Widget _buildCommentTile(dynamic comment) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F8FC),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const CircleAvatar(radius: 12, backgroundColor: Colors.black12, child: Icon(Icons.person, size: 14, color: Colors.white)),
              const SizedBox(width: 8),
              Text(comment['user']?['name'] ?? "Anonymous", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            ],
          ),
          const SizedBox(height: 8),
          Text(comment['content'] ?? "", style: const TextStyle(fontSize: 14, color: Colors.black87)),
        ],
      ),
    );
  }

  Widget _buildCommentInput() {
    return Container(
      padding: EdgeInsets.only(left: 20, right: 20, top: 12, bottom: MediaQuery.of(context).padding.bottom + 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _commentController,
              decoration: InputDecoration(
                hintText: "Add a comment...",
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                filled: true,
                fillColor: const Color(0xFFF0F0F5),
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              ),
            ),
          ),
          const SizedBox(width: 12),
          IconButton(
            onPressed: _postComment,
            icon: const Icon(Icons.send_rounded, color: Color(0xFF68417E)),
          ),
        ],
      ),
    );
  }
}

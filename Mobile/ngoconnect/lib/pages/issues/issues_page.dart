import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/issue_service.dart';
import '../../components/main/issue_card.dart';
import './report_issue_page.dart';
import './issue_details_page.dart';

class IssuesPage extends StatefulWidget {
  const IssuesPage({super.key});

  @override
  State<IssuesPage> createState() => _IssuesPageState();
}

class _IssuesPageState extends State<IssuesPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<IssueService>(context, listen: false).fetchIssues();
    });
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF68417E);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        title: const Text(
          "Community Issues",
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: Consumer<IssueService>(
        builder: (context, issueService, child) {
          if (issueService.isLoading && issueService.issues.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: primaryColor));
          }

          if (issueService.issues.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.report_gmailerrorred_rounded, size: 80, color: Colors.black.withOpacity(0.1)),
                  const SizedBox(height: 16),
                  const Text(
                    "No issues reported yet.",
                    style: TextStyle(color: Colors.black38, fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => issueService.fetchIssues(),
            color: primaryColor,
            child: ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: issueService.issues.length,
              itemBuilder: (context, index) {
                final issue = issueService.issues[index];
                return IssueCard(
                  issue: issue,
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => IssueDetailsPage(issueId: issue['id']),
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const ReportIssuePage()),
        ),
        backgroundColor: primaryColor,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text("Report Issue", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }
}

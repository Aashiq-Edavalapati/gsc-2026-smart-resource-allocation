import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'auth_service.dart';

class IssueService extends ChangeNotifier {
  final AuthService _authService;
  
  IssueService(this._authService);

  static String get baseUrl => dotenv.env['API_BASE_URL'] ?? 'https://backend-349232024775.asia-south1.run.app/api/v1';

  List<dynamic> _issues = [];
  List<dynamic> get issues => _issues;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  // List all issues (GET /issues)
  Future<void> fetchIssues() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.get(Uri.parse('$baseUrl/issues'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _issues = data['data'] ?? [];
        debugPrint('Fetched ${_issues.length} issues');
      } else {
        debugPrint('Failed to fetch issues: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error fetching issues: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Get single issue (GET /issues/:id)
  Future<Map<String, dynamic>?> getIssueDetails(String id) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/issues/$id'));
      if (response.statusCode == 200) {
        return jsonDecode(response.body)['data'];
      }
    } catch (e) {
      debugPrint('Error fetching issue details: $e');
    }
    return null;
  }

  // Report new issue (POST /issues)
  Future<bool> reportIssue({
    required String title,
    required String description,
    required String category,
    required int urgency,
    required double lat,
    required double lng,
    required String city,
  }) async {
    final user = _authService.currentUser;
    if (user == null) return false;

    try {
      final idToken = await user.getIdToken();
      final response = await http.post(
        Uri.parse('$baseUrl/issues'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $idToken',
        },
        body: jsonEncode({
          'title': title,
          'description': description,
          'category': category,
          'urgency': urgency,
          'lat': lat,
          'lng': lng,
          'city': city,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        debugPrint('Issue reported successfully');
        await fetchIssues(); // Refresh list
        return true;
      } else {
        debugPrint('Failed to report issue: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      debugPrint('Error reporting issue: $e');
    }
    return false;
  }

  // Add comment (POST /issues/:id/comments)
  Future<bool> addComment(String issueId, String content) async {
    final user = _authService.currentUser;
    if (user == null) return false;

    try {
      final idToken = await user.getIdToken();
      final response = await http.post(
        Uri.parse('$baseUrl/issues/$issueId/comments'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $idToken',
        },
        body: jsonEncode({'content': content}),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        debugPrint('Comment added successfully');
        return true;
      } else {
        debugPrint('Failed to add comment: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      debugPrint('Error adding comment: $e');
    }
    return false;
  }
}

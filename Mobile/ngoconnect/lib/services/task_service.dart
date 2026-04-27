import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'auth_service.dart';

class TaskService extends ChangeNotifier {
  final AuthService _authService;
  
  TaskService(this._authService);

  static String get baseUrl => dotenv.env['API_BASE_URL'] ?? 'https://backend-349232024775.asia-south1.run.app/api/v1';

  List<dynamic> _myAssignments = [];
  List<dynamic> get myAssignments => _myAssignments;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  // List tasks assigned to the current user (GET /volunteers/assignments)
  Future<void> fetchMyAssignments() async {
    final user = _authService.currentUser;
    if (user == null) return;

    _isLoading = true;
    notifyListeners();

    try {
      final idToken = await user.getIdToken();
      final response = await http.get(
        Uri.parse('$baseUrl/volunteers/assignments'),
        headers: {'Authorization': 'Bearer $idToken'},
      );

      if (response.statusCode == 200) {
        _myAssignments = jsonDecode(response.body)['data'] ?? [];
        debugPrint('Fetched ${_myAssignments.length} assignments');
      } else {
        debugPrint('Failed to fetch assignments: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error fetching assignments: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Apply for a task (POST /tasks/:taskId/apply)
  Future<bool> applyToTask(String taskId) async {
    final user = _authService.currentUser;
    if (user == null) return false;

    try {
      final idToken = await user.getIdToken();
      final response = await http.post(
        Uri.parse('$baseUrl/tasks/$taskId/apply'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $idToken',
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        debugPrint('Applied to task successfully');
        await fetchMyAssignments(); // Refresh list
        return true;
      } else {
        debugPrint('Failed to apply: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      debugPrint('Error applying to task: $e');
    }
    return false;
  }

  // Update assignment status/progress (PATCH /assignments/:id)
  Future<bool> updateAssignment(String assignmentId, {String? status, int? progress}) async {
    final user = _authService.currentUser;
    if (user == null) return false;

    try {
      final idToken = await user.getIdToken();
      final response = await http.patch(
        Uri.parse('$baseUrl/assignments/$assignmentId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $idToken',
        },
        body: jsonEncode({
          if (status != null) 'status': status,
          if (progress != null) 'progress': progress,
        }),
      );

      if (response.statusCode == 200) {
        debugPrint('Assignment updated successfully');
        await fetchMyAssignments(); // Refresh list
        return true;
      } else {
        debugPrint('Failed to update assignment: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error updating assignment: $e');
    }
    return false;
  }

  // Get tasks for a specific issue (GET /issues/:issueId/tasks)
  Future<List<dynamic>> getTasksForIssue(String issueId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/issues/$issueId/tasks'));
      if (response.statusCode == 200) {
        return jsonDecode(response.body)['data'] ?? [];
      }
    } catch (e) {
      debugPrint('Error fetching issue tasks: $e');
    }
    return [];
  }
}

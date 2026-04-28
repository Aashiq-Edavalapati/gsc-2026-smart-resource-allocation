import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class FieldReportService {
  // Using 10.0.2.2 for Android emulator compatibility. If running on real device or iOS, use your IP or localhost.
  static const String baseUrl = 'http://10.0.2.2:8080/api/v1';

  Future<Map<String, dynamic>?> processFieldReport({
    required String? idToken,
    required List<Map<String, dynamic>> mediaFiles,
    required double lat,
    required double lng,
    required String city,
    String? description,
    String? text,
    String? organizationId,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/ai/process-field-report-and-create-issues');
      final request = http.MultipartRequest('POST', uri);

      if (idToken != null) {
        request.headers['Authorization'] = 'Bearer $idToken';
      }

      // Body fields
      request.fields['lat'] = lat.toString();
      request.fields['lng'] = lng.toString();
      request.fields['city'] = city;
      if (description != null) request.fields['description'] = description;
      if (text != null) request.fields['text'] = text;
      if (organizationId != null) request.fields['organizationId'] = organizationId;

      // Files
      for (var media in mediaFiles) {
        final filePath = media['path'] as String;
        if (filePath == 'invalid' || filePath.startsWith('http')) continue;

        final file = File(filePath);
        if (!await file.exists()) {
          debugPrint('File does not exist: $filePath');
          continue;
        }

        final multipartFile = await http.MultipartFile.fromPath(
          'files',
          file.path,
        );
        request.files.add(multipartFile);
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201 || response.statusCode == 202) {
        return jsonDecode(response.body);
      } else {
        debugPrint('Field report API failed: ${response.statusCode} ${response.body}');
        return null;
      }
    } catch (e) {
      debugPrint('Error processing field report: $e');
      return null;
    }
  }

  Future<List<dynamic>> getIssues() async {
    try {
      final uri = Uri.parse('$baseUrl/issues');
      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data'] ?? [];
      }
    } catch (e) {
      debugPrint('Error fetching issues: $e');
    }
    return [];
  }
}

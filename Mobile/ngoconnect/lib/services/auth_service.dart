import 'dart:convert';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email'],
    serverClientId: dotenv.env['GOOGLE_SIGN_IN_SERVER_CLIENT_ID'],
  );

  // Replace with your actual backend URL
  static String get baseUrl => dotenv.env['API_BASE_URL'] ?? 'https://backend-349232024775.asia-south1.run.app/api/v1';

  // State
  User? get currentUser => _auth.currentUser;
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // Login with Email & Password
  Future<UserCredential?> login(String email, String password) async {
    try {
      final credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      // Backend sync is non-critical — fire and forget
      _syncWithBackend(credential.user);
      return credential;
    } catch (e) {
      debugPrint('Login Error: $e');
      rethrow;
    }
  }

  // Register with Email & Password
  Future<UserCredential?> register(
    String email,
    String password,
    String name,
  ) async {
    try {
      final credential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      // Update display name in Firebase
      await credential.user?.updateDisplayName(name);

      // Backend sync is non-critical — fire and forget
      _syncWithBackend(credential.user);
      return credential;
    } catch (e) {
      debugPrint('Register Error: $e');
      rethrow;
    }
  }

  // Google Sign In
  Future<UserCredential?> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null;

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;
      final AuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final userCredential = await _auth.signInWithCredential(credential);

      // Backend sync is non-critical — don't let it block or fail the login
      _syncWithBackend(userCredential.user);

      return userCredential;
    } catch (e) {
      debugPrint('Google Sign In Error: $e');
      rethrow;
    }
  }

  // Sync with Backend
  Future<void> _syncWithBackend(User? user) async {
    if (user == null) return;

    try {
      final idToken = await user.getIdToken();
      final response = await http.post(
        Uri.parse('$baseUrl/users/sync'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $idToken',
        },
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        debugPrint('Backend Sync Failed: ${response.statusCode} - ${response.body}');
      } else {
        debugPrint('Backend Sync Success: ${response.body}');
      }
    } catch (e) {
      debugPrint('Error syncing with backend: $e');
    }
  }

  // Sign Out
  Future<void> signOut() async {
    await _googleSignIn.signOut();
    await _auth.signOut();
  }

  // Get User Profile from Backend
  Future<Map<String, dynamic>?> getUserProfile() async {
    final user = currentUser;
    if (user == null) return null;

    try {
      final idToken = await user.getIdToken();
      final response = await http.get(
        Uri.parse('$baseUrl/users/me'),
        headers: {'Authorization': 'Bearer $idToken'},
      );

      if (response.statusCode == 200) {
        debugPrint('Profile Fetch Success: ${response.body}');
        return jsonDecode(response.body)['data'];
      } else {
        debugPrint('Profile Fetch Failed: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      debugPrint('Error fetching user profile: $e');
    }
    return null;
  }
}

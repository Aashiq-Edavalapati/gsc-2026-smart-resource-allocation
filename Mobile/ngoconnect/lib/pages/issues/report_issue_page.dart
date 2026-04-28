import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import '../../services/issue_service.dart';
import '../../services/auth_service.dart';

class ReportIssuePage extends StatefulWidget {
  const ReportIssuePage({super.key});

  @override
  State<ReportIssuePage> createState() => _ReportIssuePageState();
}

class _ReportIssuePageState extends State<ReportIssuePage> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _cityController = TextEditingController();
  
  String _category = 'SANITATION';
  int _urgency = 3;
  double? _lat;
  double? _lng;
  bool _isLocating = false;

  final List<String> _categories = [
    'SANITATION',
    'ROADS',
    'ELECTRICITY',
    'WATER',
    'SECURITY',
    'HEALTH',
    'OTHER'
  ];

  @override
  void initState() {
    super.initState();
    // Pre-fill city from profile if available
    final profile = Provider.of<AuthService>(context, listen: false).profileData;
    if (profile != null && profile['city'] != null) {
      _cityController.text = profile['city'];
    }
  }

  Future<void> _getCurrentLocation() async {
    setState(() => _isLocating = true);
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      
      if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
        final position = await Geolocator.getCurrentPosition();
        setState(() {
          _lat = position.latitude;
          _lng = position.longitude;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Location captured!")),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error getting location: $e")),
      );
    } finally {
      setState(() => _isLocating = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_lat == null || _lng == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please capture your current location")),
      );
      return;
    }

    final success = await Provider.of<IssueService>(context, listen: false).reportIssue(
      title: _titleController.text.trim(),
      description: _descriptionController.text.trim(),
      category: _category,
      urgency: _urgency,
      lat: _lat!,
      lng: _lng!,
      city: _cityController.text.trim(),
    );

    if (success && mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Issue reported successfully")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF68417E);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text("Report Issue", style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSectionTitle("ISSUE DETAILS"),
              const SizedBox(height: 16),
              TextFormField(
                controller: _titleController,
                decoration: _inputDecoration("Title (e.g. Water Leakage)"),
                validator: (v) => v!.isEmpty ? "Required" : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descriptionController,
                maxLines: 4,
                decoration: _inputDecoration("Description of the problem"),
                validator: (v) => v!.isEmpty ? "Required" : null,
              ),
              const SizedBox(height: 24),
              _buildSectionTitle("CLASSIFICATION"),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _category,
                decoration: _inputDecoration("Category"),
                items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                onChanged: (v) => setState(() => _category = v!),
              ),
              const SizedBox(height: 16),
              const Text("Urgency Level (1-5)", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black54)),
              Slider(
                value: _urgency.toDouble(),
                min: 1,
                max: 5,
                divisions: 4,
                activeColor: primaryColor,
                label: _urgency.toString(),
                onChanged: (v) => setState(() => _urgency = v.toInt()),
              ),
              const SizedBox(height: 24),
              _buildSectionTitle("LOCATION"),
              const SizedBox(height: 16),
              TextFormField(
                controller: _cityController,
                decoration: _inputDecoration("City"),
                validator: (v) => v!.isEmpty ? "Required" : null,
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _isLocating ? null : _getCurrentLocation,
                icon: _isLocating 
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : Icon(_lat != null ? Icons.check_circle : Icons.my_location, color: _lat != null ? Colors.green : primaryColor),
                label: Text(_lat != null ? "Location Captured" : "Capture GPS Location"),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 56),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
              const SizedBox(height: 40),
              ElevatedButton(
                onPressed: _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryColor,
                  minimumSize: const Size(double.infinity, 60),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
                child: const Text("Submit Report", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.black26, letterSpacing: 1.1),
    );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      fillColor: const Color(0xFFF8F8FC),
      filled: true,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
    );
  }
}

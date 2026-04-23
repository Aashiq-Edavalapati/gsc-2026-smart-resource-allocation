import 'package:flutter/material.dart';
import '../components/main/titlebar.dart';
import '../components/main/history_card.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  // This state variable controls whether the recording layer is open or not
  bool _isRecordingMode = false;

  void _toggleRecordingMode() {
    setState(() {
      _isRecordingMode = !_isRecordingMode;
    });
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    
    // Top layer takes 60%, Bottom layer takes 40%
    final topLayerHeight = size.height * 0.6;
    final bottomLayerHeight = size.height * 0.4;
    
    // Variables for the normal state "New Recording" button
    const double padding = 20.0;
    const double buttonHeight = 60.0;

    return Scaffold(
      backgroundColor: Colors.white,
      extendBodyBehindAppBar: true,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(100.0),
        child: AnimatedOpacity(
          duration: const Duration(milliseconds: 250),
          opacity: _isRecordingMode ? 0.0 : 1.0,
          child: const MainTitleBar(),
        ),
      ),
      body: Stack(
        children: [
          // ---------------------------------------------------
          // 1. BASE LAYER: Content
          // ---------------------------------------------------
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: padding),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 10),
                Text(
                  "Latest Recordings",
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                ),
                const SizedBox(height: 10),
                Flexible(
                  flex: 7,
                  fit: FlexFit.loose,
                  child: Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFAFAFA),
                      borderRadius: BorderRadius.circular(32),
                    ),
                    child: ListView(
                      shrinkWrap: true,
                      // Extra bottom padding so the list items don't hide behind the floating button permanently
                      padding: const EdgeInsets.only(
                        top: 8, 
                        bottom: buttonHeight + (padding * 2),
                      ),
                      children: [
                        HistoryCard(
                          title: "Community Outreach",
                          duration: "04:20",
                          photoCount: 3,
                          videoCount: 1,
                          onViewTap: () {},
                        ),
                        HistoryCard(
                          title: "Resource Allocation",
                          duration: "10:15",
                          photoCount: 5,
                          onViewTap: () {},
                        ),
                        HistoryCard(
                          title: "Donation Drive",
                          duration: "02:45",
                          videoCount: 2,
                          onViewTap: () {},
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ---------------------------------------------------
          // 2. TOP LAYER (60% Scren bounds)
          // ---------------------------------------------------
          AnimatedPositioned(
            duration: const Duration(milliseconds: 350),
            curve: Curves.easeOutCubic,
            // When open it drops to top = 0. When closed it slides up completely out of view
            top: _isRecordingMode ? 0 : -topLayerHeight,
            left: 0,
            right: 0,
            height: topLayerHeight,
            child: IgnorePointer(
              ignoring: !_isRecordingMode,
                child: Container(
                  color: Colors.white,
                  child: Column(
                    children: [
                    // 1. Thumbnail Area (Top) with top margin for safe area
                    Container(
                      height: size.height * 0.25,
                      width: double.infinity,
                      margin: const EdgeInsets.only(top: 60, left: 20, right: 20, bottom: 20),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF5F5F5),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: Colors.black.withOpacity(0.05)),
                      ),
                      child: const Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.image_outlined, color: Colors.black26, size: 40),
                            SizedBox(height: 8),
                            Text("Thumbnail Preview", style: TextStyle(color: Colors.black26)),
                          ],
                        ),
                      ),
                    ),
                      
                    // 2. Transcription Area with Gradient Fade
                    Expanded(
                      child: Stack(
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 24),
                            child: ListView(
                              padding: const EdgeInsets.only(bottom: 60),
                              children: [
                                Text(
                                  "Transcription",
                                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black38,
                                    letterSpacing: 1.2,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  "The community outreach program successfully identified three new areas for resource allocation. Initial assessments show a high demand for educational materials and healthcare supplies. The local NGO representatives confirmed that the donation drive will begin early next week to address these needs...",
                                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                    height: 1.6,
                                    color: Colors.black87,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          // Bottom Fade Effect (Gradient)
                          Positioned(
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 60,
                            child: Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [
                                    Colors.white.withOpacity(0),
                                    Colors.white,
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    ],
                  ),
                ),
              ),
          ),

          AnimatedPositioned(
            duration: const Duration(milliseconds: 350),
            curve: Curves.easeOutCubic,
            // If closed: Anchor to bottom padding. If open: Snap to absolute bottom
            bottom: _isRecordingMode ? 0 : padding,
            left: _isRecordingMode ? 0 : padding,
            right: _isRecordingMode ? 0 : padding,
            height: _isRecordingMode ? null : buttonHeight, // null height allows it to fit content
            child: GestureDetector(
              onTap: _isRecordingMode ? null : _toggleRecordingMode,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 350),
                curve: Curves.easeOutCubic,
                decoration: BoxDecoration(
                  color: const Color(0xFF68417E),
                  borderRadius: _isRecordingMode 
                      ? const BorderRadius.vertical(top: Radius.circular(32)) 
                      : BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.15),
                      blurRadius: 10,
                      offset: const Offset(0, 5),
                    )
                  ],
                ),
                child: ClipRRect(
                  borderRadius: _isRecordingMode 
                      ? const BorderRadius.vertical(top: Radius.circular(32)) 
                      : BorderRadius.circular(24),
                  child: SingleChildScrollView(
                    physics: const NeverScrollableScrollPhysics(),
                    child: _isRecordingMode
                        ? _buildRecordingBottomUI()
                        : _buildClosedButtonUI(context),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // The small state: The Button content
  Widget _buildClosedButtonUI(BuildContext context) {
    return SizedBox(
      height: 60, // Fixed height for the closed button state
      child: Center(
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.mic_none_rounded, color: Colors.white),
            const SizedBox(width: 8),
            Text(
              "New Recording",
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // The expanded state: Action Sheet that fits content
  Widget _buildRecordingBottomUI() {
    return Column(
      mainAxisSize: MainAxisSize.min, // Important: Fits content
      children: [
        // Aesthetic drag handle indicator
        Container(
          margin: const EdgeInsets.only(top: 12, bottom: 20),
          height: 5,
          width: 40,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.3),
            borderRadius: BorderRadius.circular(10),
          ),
        ),
        
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              Expanded(
                child: _buildActionButton(
                  icon: Icons.videocam_outlined,
                  label: "Video",
                  onTap: () {},
                ),
              ),
              Expanded(
                child: _buildActionButton(
                  icon: Icons.mic_none_rounded,
                  label: "Voice",
                  onTap: () {},
                ),
              ),
              Expanded(
                child: _buildActionButton(
                  icon: Icons.camera_alt_outlined,
                  label: "Photo",
                  onTap: () {},
                ),
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 24),
        
        // Submit for Review Button
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: SizedBox(
            width: double.infinity,
            height: 55,
            child: ElevatedButton(
              onPressed: () {
                // TODO: Submit review logic
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF68417E),
                elevation: 0,
                shape: ContinuousRectangleBorder(
                  borderRadius: BorderRadius.circular(32),
                ),
              ),
              child: const Text(
                "Submit for Review", 
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ),

        const SizedBox(height: 12),
        
        // Cancel/Close Button
        Padding(
          padding: const EdgeInsets.only(left: 20, right: 20, bottom: 40),
          child: SizedBox(
            width: double.infinity,
            height: 55,
            child: OutlinedButton(
              onPressed: _toggleRecordingMode,
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: const BorderSide(color: Colors.white24),
                shape: ContinuousRectangleBorder(
                  borderRadius: BorderRadius.circular(32),
                ),
              ),
              child: const Text(
                "Cancel", 
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
            ),
            child: Icon(icon, color: Colors.white, size: 28),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

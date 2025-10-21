# WorldSim 3D Terrain Map - Feature Documentation

## Overview

WorldSim now features a stunning **3D terrain visualization** that transforms the professional 2D data visualization into an impressive, interactive 3D experience. The system intelligently defaults to 2D mode for professional data analysis while offering an optional 3D mode for presentations and demonstrations.

---

## 🎯 Key Features

### **1. Dual Mode System**
- **2D Mode (Default)**: Professional, flat view optimized for data analysis
- **3D Mode**: Dramatic terrain visualization for presentations and demos
- **Smooth Transitions**: 800ms animated switching between modes
- **All data visualizations work in both modes** - stress colors, popups, interactions

### **2. 3D Terrain Visualization**
- **Mapbox Terrain RGB**: High-quality elevation data
- **Terrain Exaggeration**: 1.5x multiplier (visible but not extreme)
- **Hillshade Layer**: Realistic depth and dimension with shadow/highlight effects
- **Sky Atmosphere**: Professional atmospheric rendering in 3D mode

### **3. Interactive Controls**

#### **2D/3D Toggle Button**
- Located in top-right corner (below navigation controls)
- Visual indicator: 🗺️ (2D) or 🏔️ (3D)
- Color changes: White/gray (2D) → Purple/blue gradient (3D)
- Smooth transition animation
- Disabled during transitions to prevent conflicts

#### **Reset View Button**
- Restore default view position
- Adapts to current mode (2D flat or 3D angled)
- Smooth 1.2s animation to default bounds
- Keeps El Salvador perfectly centered

#### **Pitch and Bearing Controls**
- **Right-click drag**: Rotate and tilt the map
- **Touch rotate**: Two-finger rotate on mobile/tablet
- **Navigation compass**: Visual pitch indicator enabled
- **Smooth easing**: Professional camera movements

### **4. 3D Buildings**
- Major cities (San Salvador area) show 3D building extrusions
- Buildings appear only in 3D mode
- Height data from Mapbox building layer
- Subtle opacity (0.6) to not overwhelm data
- Activates at zoom level 10+

### **5. Mode Indicator**
- Top-center badge showing current mode
- **2D Mode**: White background, gray text
- **3D Mode**: Purple/blue gradient, white text
- Smooth 800ms transition animation

---

## 📊 Data Visualization in 3D

### **Stress Colors Still Work**
All stress visualizations render correctly on top of 3D terrain:
- ✅ Green (#10b981): 0-15% stress (Healthy)
- ✅ Yellow (#f59e0b): 15-35% stress (Caution)
- ✅ Orange (#f97316): 35-60% stress (Warning)
- ✅ Red (#ef4444): 60-100% stress (Critical)

### **Layer Order (Bottom to Top)**
1. Base map (Mapbox Light)
2. 3D Terrain (when pitch > 0)
3. Hillshade (depth and shadows)
4. Stress-colored region fills **← Data visualization**
5. Region outlines
6. Region labels
7. 3D buildings (in 3D mode only)
8. Sky atmosphere

### **Interactive Features Maintained**
- ✅ Click regions for detailed popups
- ✅ Hover effects (darker color + thicker border)
- ✅ Stress-based color coding
- ✅ Professional government-style popups
- ✅ All statistics and metrics

---

## 🎨 Visual Design

### **2D Mode (Professional Default)**
```
Pitch: 0° (flat)
Bearing: 0° (north-up)
Terrain: Loaded but not visible
Buildings: Hidden
Style: Clean, professional data visualization
Use Case: Data analysis, reports, official presentations
```

### **3D Mode (Impressive Demos)**
```
Pitch: 50° (angled view)
Bearing: 0° (north-up, user can rotate)
Terrain: Visible with 1.5x exaggeration
Buildings: Visible in cities
Style: Dramatic, impressive visualization
Use Case: Executive demos, marketing, presentations
```

### **Color Schemes**
- **2D Toggle Button**: White bg, gray-700 text, gray-300 border
- **3D Toggle Button**: Purple-600 to blue-600 gradient, white text
- **Mode Indicator (2D)**: White/90 bg, gray-700 text
- **Mode Indicator (3D)**: Purple-600 to blue-600 gradient, white text

---

## 🚀 User Experience

### **Default Experience**
1. Map loads in **2D mode** (professional default)
2. User sees clean, flat data visualization
3. Optional 3D toggle button visible in top-right

### **3D Mode Experience**
1. User clicks "2D Mode" button
2. Smooth 800ms animation to 3D view
3. Terrain becomes visible with hillshading
4. Buildings appear in major cities
5. Button changes to "3D Mode" with gradient
6. Mode indicator updates to show "3D Terrain Mode"
7. User can right-click drag to rotate/tilt

### **Returning to 2D**
1. User clicks "3D Mode" button
2. Smooth 800ms animation back to flat view
3. Terrain fades (still loaded for performance)
4. Buildings hide
5. Button returns to white with "2D Mode"
6. Mode indicator shows "2D Professional Mode"

---

## 🎯 Performance Optimizations

### **Efficient Loading**
- Terrain source loaded once on map initialization
- Not removed when switching modes (faster transitions)
- Visibility controlled by pitch/bearing, not layer removal
- Buildings load on-demand at appropriate zoom levels

### **Smooth Transitions**
- 800ms easing for mode switches
- Camera movements use Mapbox's optimized easeTo()
- No jarring jumps or instant changes
- Button disabled during transitions to prevent conflicts

### **Resource Management**
- Terrain tiles cached after first load
- Buildings only render when visible (zoom 10+)
- Hillshade layer always present (minimal overhead)
- Sky layer added once, controlled by paint properties

---

## 🗺️ Technical Implementation

### **3D Terrain Setup**
```javascript
// Add terrain source
mapInstance.addSource('mapbox-dem', {
  type: 'raster-dem',
  url: 'mapbox://mapbox.terrain-rgb',
  tileSize: 512,
  maxzoom: 14
});

// Enable terrain
mapInstance.setTerrain({
  source: 'mapbox-dem',
  exaggeration: 1.5 // Visible but not extreme
});
```

### **Hillshade Configuration**
```javascript
mapInstance.addLayer({
  id: 'hillshading',
  type: 'hillshade',
  source: 'mapbox-dem',
  paint: {
    'hillshade-exaggeration': 0.3,
    'hillshade-shadow-color': '#1e293b',
    'hillshade-highlight-color': '#f1f5f9',
    'hillshade-illumination-direction': 315
  }
});
```

### **3D Buildings**
```javascript
mapInstance.addLayer({
  id: '3d-buildings',
  source: 'composite',
  'source-layer': 'building',
  type: 'fill-extrusion',
  minzoom: 10,
  paint: {
    'fill-extrusion-color': '#cbd5e1',
    'fill-extrusion-opacity': 0.6,
    'fill-extrusion-height': ['get', 'height']
  }
});
```

### **Mode Toggle Logic**
```javascript
const toggle3DMode = () => {
  const newMode = !is3DMode;

  if (newMode) {
    // Switch to 3D
    mapInstance.easeTo({
      pitch: 50,
      bearing: 0,
      duration: 800,
      essential: true
    });
  } else {
    // Switch to 2D
    mapInstance.easeTo({
      pitch: 0,
      bearing: 0,
      duration: 800,
      essential: true
    });
  }
};
```

---

## 🎓 Best Practices

### **When to Use 2D Mode**
- ✅ Data analysis and comparison
- ✅ Official reports and documentation
- ✅ Precise measurements
- ✅ Screen recordings for training
- ✅ Accessibility (easier to read)

### **When to Use 3D Mode**
- ✅ Executive presentations
- ✅ Stakeholder demos
- ✅ Marketing materials
- ✅ Trade shows and conferences
- ✅ "Wow factor" demonstrations
- ✅ Geographic context (terrain awareness)

---

## 🔧 Configuration Options

### **Terrain Exaggeration**
Current: `1.5` (good balance)
- Lower (0.5-1.0): Subtle elevation
- Higher (2.0-3.0): Dramatic mountains (may obscure data)

### **Initial Pitch in 3D**
Current: `50°` (professional angled view)
- Lower (30-40°): More conservative
- Higher (60-70°): More dramatic (but harder to read labels)

### **Transition Duration**
Current: `800ms` (smooth and professional)
- Faster (400-600ms): Snappier
- Slower (1000-1500ms): More cinematic

### **Building Minimum Zoom**
Current: `10` (appears at city scale)
- Lower (8-9): Buildings visible earlier
- Higher (11-12): Buildings only at street scale

---

## 📱 Mobile & Responsive

### **Touch Controls**
- ✅ Two-finger pinch: Zoom
- ✅ Two-finger rotate: Bearing
- ✅ Two-finger tilt: Pitch (3D mode)
- ✅ Single tap: Select region
- ✅ Touch buttons: 2D/3D toggle, Reset

### **Performance on Mobile**
- Terrain rendering optimized for mobile GPUs
- Buildings may be hidden on lower-end devices
- Smooth 60fps on modern smartphones
- Reduced tile quality on slow connections

---

## 🎬 Animation Timeline

### **2D → 3D Transition**
```
0ms:    Button clicked, transition starts
0-800ms: Camera pitches from 0° to 50°
        Terrain becomes visible
        Hillshade effect appears
800ms:  Button updates to "3D Mode"
        Buildings fade in (if zoomed in)
        Mode indicator updates
850ms:  Transition complete, button re-enabled
```

### **3D → 2D Transition**
```
0ms:    Button clicked, transition starts
0-800ms: Camera pitches from 50° to 0°
        Terrain fades from view
        Buildings fade out
800ms:  Button updates to "2D Mode"
        Mode indicator updates
850ms:  Transition complete, button re-enabled
```

---

## 🐛 Troubleshooting

### **Terrain Not Showing**
1. Check Mapbox token has terrain access
2. Verify pitch > 0 in 3D mode
3. Check browser WebGL support
4. Look for terrain source errors in console

### **Buildings Not Appearing**
1. Zoom in to level 10+
2. Verify 3D mode is active
3. Check if area has building data (mainly cities)
4. Inspect layer visibility in console

### **Slow Performance**
1. Reduce terrain exaggeration (1.0 instead of 1.5)
2. Hide 3D buildings on slower devices
3. Reduce transition duration (600ms instead of 800ms)
4. Lower max pitch (45° instead of 50°)

### **Data Not Visible in 3D**
1. Check layer order (regions should be above terrain)
2. Verify fill-opacity is sufficient
3. Ensure stress colors are updating
4. Check z-index in layer configuration

---

## 🎨 Customization Guide

### **Change Terrain Exaggeration**
```javascript
mapInstance.setTerrain({
  source: 'mapbox-dem',
  exaggeration: 2.0 // Increase for more dramatic effect
});
```

### **Adjust Hillshade Intensity**
```javascript
mapInstance.setPaintProperty('hillshading', 'hillshade-exaggeration', 0.5);
```

### **Change 3D Pitch Angle**
```javascript
mapInstance.easeTo({
  pitch: 60, // Steeper angle
  duration: 800
});
```

### **Modify Building Appearance**
```javascript
mapInstance.setPaintProperty('3d-buildings', 'fill-extrusion-opacity', 0.8);
mapInstance.setPaintProperty('3d-buildings', 'fill-extrusion-color', '#94a3b8');
```

---

## 📊 Comparison: 2D vs 3D

| Feature | 2D Mode | 3D Mode |
|---------|---------|---------|
| **Data Readability** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good |
| **Visual Impact** | ⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent |
| **Performance** | ⭐⭐⭐⭐⭐ Fast | ⭐⭐⭐⭐ Good |
| **Professional Reports** | ✅ Ideal | ⚠️ Use sparingly |
| **Executive Demos** | ⚠️ Basic | ✅ Impressive |
| **Accessibility** | ✅ Easy to read | ⚠️ May be harder |
| **Geographic Context** | ⭐⭐⭐ Basic | ⭐⭐⭐⭐⭐ Excellent |
| **Load Time** | ⭐⭐⭐⭐⭐ Instant | ⭐⭐⭐⭐ Fast |

---

## 🎯 Recommended Usage

### **Government Officials**
- **Default**: 2D mode for data analysis
- **Use 3D**: When presenting to non-technical audiences

### **Researchers**
- **Default**: 2D mode for measurements
- **Use 3D**: Understanding terrain impact on infrastructure

### **NGOs**
- **Default**: 2D mode for program planning
- **Use 3D**: Donor presentations and proposals

### **Private Sector**
- **Default**: 2D mode for site analysis
- **Use 3D**: Client presentations and marketing

---

## 🚀 Future Enhancements

### **Potential Additions**
1. **Time-based shadows**: Show sunlight at different times of day
2. **Satellite imagery**: Toggle to satellite base map
3. **3D data extrusion**: Elevate regions based on stress level
4. **Flyover animations**: Automated camera tours
5. **Custom camera angles**: Save favorite views
6. **VR/AR support**: Immersive terrain exploration

---

## 📝 Code Examples

### **Basic 3D Map Usage**
```tsx
import { MapView3D } from '@/components/MapView3D';

function MyPage() {
  return (
    <MapView3D
      height="700px"
      simulationResults={results}
      onRegionClick={(id, name) => console.log(id, name)}
    />
  );
}
```

### **Programmatic Mode Control**
```javascript
// Access map instance
const mapInstance = map.current;

// Switch to 3D
mapInstance.easeTo({
  pitch: 50,
  bearing: 45, // Northeast view
  duration: 800
});

// Return to 2D
mapInstance.easeTo({
  pitch: 0,
  bearing: 0,
  duration: 800
});
```

---

## 🎓 Training Tips

### **For End Users**
1. "Start in 2D mode for analysis"
2. "Click the mountain icon for 3D view"
3. "Right-click and drag to rotate the map"
4. "Use Reset button to center the view"
5. "All data features work in both modes"

### **For Administrators**
1. Ensure Mapbox token has terrain access
2. Test on target devices (especially mobile)
3. Adjust exaggeration based on audience
4. Prepare screenshots in both modes for docs
5. Train users on appropriate mode selection

---

**Last Updated:** October 20, 2025
**Component:** MapView3D.tsx
**Mapbox GL JS Version:** Latest
**Terrain Source:** mapbox://mapbox.terrain-rgb

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modular HTML sports data parser application that extracts and formats sports data from Chinese sports websites. The application parses HTML content from live.titan007.com and converts it into structured Markdown format.

## Architecture

**Modular Architecture**: The application follows a module-based structure with clear separation of concerns.

**Entry Point**: `script.js` serves as the module loader and application bootstrap, loading dependencies in order and providing error handling.

**Module Structure**:
```
modules/
├── helpers.js    - Utility functions and safe function calls
├── core.js       - Global state and SmartContentManager class
├── parsers.js    - HTML parsing logic for leagues, matches, and stats
├── ui.js         - UI management and interaction handlers
└── utils.js      - Additional utilities and compatibility functions
```

**Core Components**:
- **SmartContentManager**: Handles large content efficiently with memory optimization and progressive loading
- **Module Loader**: Sequential module loading with dependency management
- **Error Handling**: Global error catching and user-friendly error display

## Key Modules

### `modules/core.js`
- **SmartContentManager**: Intelligent content handling for large HTML files (>50KB)
- **Global State**: Stores parsed results (`currentLeagueData`, `currentMatchData`, etc.)
- **Memory Management**: Placeholder system for large content to prevent UI freezing

### `modules/parsers.js`  
- **League Parser**: Extracts league information from spans with `onclick*="CheckLeague"` attributes
- **Match Parser**: Parses match data from table rows with `id^="tr1_"` pattern
- **Stats Parser**: Extracts technical statistics from match detail pages
- **Event Parser**: Processes match events and timeline data

### `modules/ui.js`
- **Tab Management**: Three-tab interface (leagues, matches, stats)
- **Content Controls**: Smart textarea management with character counters
- **User Interactions**: Copy, clear, and download functionality

### `modules/helpers.js`
- **Content Retrieval**: Safe access to SmartContentManager content
- **Error Handling**: `safeCall()` function for robust function execution
- **Utility Functions**: Common helper functions shared across modules

## Data Sources

The application targets specific data from:
- **League Data**: `https://live.titan007.com/oldIndexall.aspx` (span elements with CheckLeague onclick)
- **Match Data**: Same URL, table_live table structures with `id^="tr1_"` pattern
- **Technical Stats**: Match detail pages like `https://live.titan007.com/detail/2784241cn.htm`

## Development Workflow

**Running the Application**:
```bash
# Open index.html in a web browser
# No build process required - pure client-side application
```

**Module Loading Order**:
1. `helpers.js` - Foundation utilities
2. `core.js` - Core classes and state management  
3. `parsers.js` - Data extraction logic
4. `ui.js` - User interface management
5. `utils.js` - Additional utilities

**Testing**:
- No automated tests currently
- Test manually by loading different HTML content from target sites
- Verify parsing accuracy and UI responsiveness

## Technical Notes

**DOM Parsing**: Uses native browser DOMParser for HTML processing (Cheerio.js referenced but unused)

**Memory Optimization**: SmartContentManager automatically handles large content (>50KB) with lazy loading

**Error Recovery**: Comprehensive error handling with fallback mechanisms and user feedback

**State Persistence**: Global variables maintain parsed results for download functionality

**Mobile Support**: Responsive design with CSS media queries for mobile devices

## Localization

Interface is in Chinese (zh-CN) for parsing Chinese sports data sources. All UI text, error messages, and output formatting use Chinese language conventions.
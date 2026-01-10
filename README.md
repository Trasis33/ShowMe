# ShowMe

A visual mockup and annotation tool for Claude Code. Draw mockups, add multi-page references, and provide component-specific feedback with coordinate-tracked annotations.

## Features

### Multi-Page Support

- Create multiple pages to organize your mockups
- Import images/screenshots as page references
- Add blank pages for freehand drawing
- Per-page state management with independent undo/redo

### Drawing Tools

- **Pen** (P) - Freehand drawing
- **Rectangle** (R) - Draw rectangles
- **Circle** (C) - Draw circles/ellipses
- **Arrow** (A) - Draw arrows with arrowheads
- **Text** (T) - Add text labels
- **Eraser** (E) - Erase areas

### Annotation System

Track component-specific feedback with coordinate-aware annotations:

- **Pin** (1) - Click to place numbered markers
- **Area** (2) - Draw selection rectangles to highlight regions
- **Arrow** (3) - Draw directional arrows for flow/connections
- **Highlight** (4) - Freehand highlighting

Each annotation:

- Has a unique number for easy reference
- Stores exact coordinates and bounds
- Supports individual feedback/comments
- Appears in the feedback sidebar

### Feedback UI

- **Sidebar** - View all annotations with inline feedback editing
- **Popover** - Click any annotation on canvas for quick feedback entry
- **Sync** - Changes sync between sidebar and popover in real-time

## Installation

### Prerequisites

- [Bun](https://bun.sh) runtime

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/showme.git
cd showme

# Install dependencies
bun install

# Run the development server
bun run dev
```

## Usage

### As a Claude Code Plugin

ShowMe integrates with Claude Code as a hook/skill. When invoked via `/showme`:

1. A browser window opens with the drawing canvas
2. Draw your mockup or import an image
3. Add annotations to mark specific areas
4. Add feedback for each annotation
5. Click "Send to Claude" to submit

### Keyboard Shortcuts

**Drawing Tools:**

- `P` - Pen
- `R` - Rectangle
- `C` - Circle
- `A` - Arrow
- `T` - Text
- `E` - Eraser

**Annotation Tools:**

- `M` - Toggle annotation mode
- `1` - Pin annotation
- `2` - Area annotation
- `3` - Arrow annotation
- `4` - Highlight annotation

**Actions:**

- `Ctrl+Z` - Undo
- `Ctrl+Y` / `Ctrl+Shift+Z` - Redo
- `Delete` / `Backspace` - Delete selected annotation
- `Escape` - Deselect / close popover

### Workflow

1. **Create Pages** - Use the "+" button in the left sidebar to add blank pages or import images
2. **Draw** - Use drawing tools to create your mockup
3. **Annotate** - Switch to annotation mode and mark specific components
4. **Add Feedback** - Click annotations or use the sidebar to add detailed feedback
5. **Submit** - Send all pages with annotations to Claude

## Data Structure

When submitted, ShowMe sends structured data including:

```typescript
{
  pages: [
    {
      id: string,
      name: string,
      image: string,  // Base64 PNG
      width: number,
      height: number,
      annotations: [
        {
          id: string,
          type: "pin" | "area" | "arrow" | "highlight",
          number: number,
          bounds: { x, y, width, height },
          feedback: string
        }
      ]
    }
  ],
  globalNotes: string
}
```

## Development

### Project Structure

```
showme/
├── server/
│   └── index.ts        # Bun server with API endpoints
├── ui/
│   ├── index.html      # Main UI layout
│   ├── main.ts         # Canvas application logic
│   └── styles.css      # Styling
├── skills/
│   └── showme.md       # Claude Code skill definition
├── hooks/
│   └── hooks.json      # Hook configuration
└── package.json
```

### Building

```bash
# Build for production
bun run build

# Start production server
bun start
```

### Scripts

- `bun run dev` - Start development server with hot reload
- `bun run build` - Build for production
- `bun start` - Run the ShowMe server

## Configuration

The hook is configured in `hooks/hooks.json`:

```json
{
  "hooks": [
    {
      "matcher": { "type": "Skill", "skill_name": "showme" },
      "hooks": [
        {
          "type": "command",
          "command": "bun run server/index.ts",
          "timeout": 300
        }
      ]
    }
  ]
}
```

## License

MIT

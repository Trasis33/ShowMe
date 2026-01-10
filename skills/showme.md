# ShowMe - Quick Visual Feedback for Claude Code

ShowMe lets you quickly generate visual feedback that is automatically analyzed by Claude Code. It's the fastest way to communicate visually with Claude.

## Instructions for Claude

When the user invokes `/showme`, execute this command and wait for the result:

```bash
bun run /mnt/c/Users/dell/Documents/Projects/ShowMe/server/index.ts
```

The command will:

1. Open a browser with a drawing canvas
2. Wait for the user to draw and click "Send to Claude"
3. Output JSON with the drawing data

**After receiving the output, you MUST extract BOTH the image AND the notes:**

```bash
# Extract the image
head -1 <output_file> | grep -o '"image":"data:image/png;base64,[^"]*"' | sed 's/"image":"data:image\/png;base64,//' | sed 's/"$//' | base64 -d > /tmp/showme-result.png

# Extract the notes (user's question/feedback)
head -1 <output_file> | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('hookSpecificOutput', {}).get('showme', {}).get('notes', ''))"
```

Then:

1. Read `/tmp/showme-result.png` to view the image
2. **Read and respond to the notes** - this contains the user's question or request about the image

**IMPORTANT:** The notes field often contains the user's actual question or request. Never ignore it!

## User Instructions

When the canvas opens:

- **P** - Pen (free draw)
- **R** - Rectangle
- **C** - Circle
- **A** - Arrow
- **T** - Text labels
- **E** - Eraser
- **Ctrl+V** - Paste screenshot
- **Ctrl+Z** - Undo

Add notes in the text field to ask questions or provide context, then click "Send to Claude" when done.

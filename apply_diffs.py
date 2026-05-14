import os
import sys
import argparse
import shutil
import re
from typing import Dict, List, Optional, Tuple
import json
from pathlib import Path

def backup_file(filename):
    """Create a backup of the file before modification"""
    backup = filename + '.bak'
    if not os.path.exists(backup):
        shutil.copy2(filename, backup)
        print(f"🔄 Backup created: {backup}")

class DiffParser:
    """Generic diff parser that handles multiple diff formats"""
    
    def __init__(self):
        self.patches = []
        self.supported_formats = ['custom', 'unified', 'context']
    
    def parse_file(self, diff_file: str) -> List[Dict]:
        """Main entry point to parse any diff format"""
        with open(diff_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Auto-detect format and parse accordingly
        if self._is_unified_format(content):
            return self._parse_unified_diff(content)
        elif self._is_custom_format(content):
            return self._parse_custom_diff(content)
        else:
            return self._parse_custom_diff(content)  # Fallback
    
    def _is_custom_format(self, content: str) -> bool:
        """Check if this is our custom numbered format"""
        return bool(re.search(r'\d+\.\s+(Existing|New)\s+File:', content))
    
    def _is_unified_format(self, content: str) -> bool:
        """Check if this is a standard unified diff format"""
        return bool(re.search(r'^diff --git|^--- .*\n\+\+\+ .*', content, re.MULTILINE))
    
    def _parse_unified_diff(self, content: str) -> List[Dict]:
        """Parse standard unified diff format (git diff output)"""
        patches = []
        
        # Split by file sections (diff --git)
        file_sections = re.split(r'^diff --git ', content, flags=re.MULTILINE)[1:]
        
        for section in file_sections:
            patch = self._parse_unified_section(section)
            if patch:
                patches.append(patch)
        
        return patches
    
    def _parse_unified_section(self, section: str) -> Optional[Dict]:
        """Parse a single unified diff section"""
        lines = section.split('\n')
        
        if not lines:
            return None
        
        # Extract filename from first line: "a/file b/file"
        first_line = lines[0]
        match = re.search(r'^(\S+)\s+(\S+)$', first_line)
        if not match:
            return None
        
        filename_a = match.group(1)
        filename_b = match.group(2)
        
        # Use b/ filename (after changes) and remove prefix
        filename = filename_b
        if filename.startswith('b/'):
            filename = filename[2:]
        
        # Check if this is a new file
        is_new_file = any('new file mode' in line for line in lines[:10])
        
        # Extract hunks (changes)
        changes = []
        current_hunk = []
        in_hunk = False
        
        for line in lines:
            # Start of hunk
            if line.startswith('@@'):
                if current_hunk:
                    changes.append('\n'.join(current_hunk))
                current_hunk = []
                in_hunk = True
                continue
            
            # Inside hunk
            if in_hunk:
                if line.startswith('+') and not line.startswith('+++'):
                    # Addition line
                    current_hunk.append(line[1:])  # Remove + prefix
                elif line.startswith(' '):
                    # Context line (keep for structure)
                    current_hunk.append(line[1:])
        
        # Don't forget the last hunk
        if current_hunk:
            changes.append('\n'.join(current_hunk))
        
        # For new files, extract all content
        new_content = None
        if is_new_file:
            content_lines = []
            for line in lines:
                if line.startswith('+') and not line.startswith('+++'):
                    content_lines.append(line[1:])
            new_content = '\n'.join(content_lines) if content_lines else None
        
        return {
            'filename': filename,
            'is_new_file': is_new_file,
            'changes': changes,
            'new_content': new_content,
            'file_type': self._get_file_type(filename)
        }
    
    def _parse_custom_diff(self, content: str) -> List[Dict]:
        """Parse custom diff format with numbered sections"""
        patches = []
        
        # Split by numbered sections and --- separators
        sections = re.split(r'\n(?:\s*\d+\.\s+|---+\n)', content)
        
        for section in sections:
            if not section.strip():
                continue
            
            patch = self._parse_custom_section(section)
            if patch:
                patches.append(patch)
        
        return patches
    
    def _parse_custom_section(self, section: str) -> Optional[Dict]:
        """Parse a single custom diff section"""
        lines = section.split('\n')
        filename = None
        is_new_file = False
        changes = []
        new_file_content = []
        
        # Find filename and type
        for line in lines[:10]:
            if 'Existing File:' in line or 'New File:' in line:
                is_new_file = 'New File:' in line
                # Extract filename with flexible path matching
                path_match = re.search(r'([a-zA-Z0-9_-]+/[^\s\n]+\.[a-zA-Z0-9]+)', line)
                if path_match:
                    filename = path_match.group(1)
                    break
        
        if not filename:
            return None
        
        # Handle non-existing files as new files
        if not os.path.exists(filename) and not is_new_file:
            is_new_file = True
        
        # Parse content based on file type
        if is_new_file:
            new_file_content = self._extract_new_file_content(lines, filename)
        else:
            changes = self._extract_changes(lines, filename)
        
        return {
            'filename': filename,
            'is_new_file': is_new_file,
            'changes': changes,
            'new_content': '\n'.join(new_file_content) if new_file_content else None,
            'file_type': self._get_file_type(filename)
        }
    
    def _extract_new_file_content(self, lines: List[str], filename: str) -> List[str]:
        """Extract complete content for new files"""
        content = []
        in_code_section = False
        
        for line in lines:
            # Start of code section
            if self._is_code_section_start(line, filename):
                in_code_section = True
                continue
            
            # End of section
            if in_code_section and line.strip() == '---':
                break
            
            # Extract content lines
            if in_code_section:
                if line.strip() == '':
                    content.append('')  # Preserve empty lines
                elif not line.strip().startswith('//') or 'import' in line or 'export' in line:
                    # Remove leading spaces but preserve relative indentation
                    cleaned_line = self._clean_line(line)
                    if cleaned_line is not None:
                        content.append(cleaned_line)
        
        return content
    
    def _extract_changes(self, lines: List[str], filename: str) -> List[str]:
        """Extract changes for existing files"""
        changes = []
        in_code_section = False
        current_block = []
        
        for line in lines:
            # Special handling for CSS files
            if filename.endswith('.css') and line.strip().startswith('+'):
                # Direct CSS addition
                css_line = line[1:].strip() if len(line) > 1 else ''
                current_block.append(css_line)
                continue
            
            # Start of code section
            if self._is_code_section_start(line, filename):
                in_code_section = True
                continue
            
            # End of section
            if in_code_section and (line.strip() == '---' or 
                                   (line.strip() == '' and current_block)):
                if current_block:
                    changes.append('\n'.join(current_block))
                    current_block = []
                if line.strip() == '---':
                    break
                continue
            
            # Extract addition lines
            if in_code_section:
                if line.startswith('  +') or line.startswith('+'):
                    # Addition line
                    code_line = self._extract_addition_line(line)
                    if code_line is not None:
                        current_block.append(code_line)
                elif line.startswith('  ') and current_block:
                    # Context line within a block
                    code_line = line[2:] if len(line) > 2 else ''
                    current_block.append(code_line)
        
        # Handle final block
        if current_block:
            changes.append('\n'.join(current_block))
        
        return changes
    
    def _is_code_section_start(self, line: str, filename: str) -> bool:
        """Check if line marks start of code section"""
        if line.strip().startswith('//') and any(part in line for part in filename.split('/')):
            return True
        return False
    
    def _clean_line(self, line: str) -> Optional[str]:
        """Clean and format a line of content"""
        if line.startswith('  '):
            return line[2:]
        elif line.strip():
            return line.strip()
        return None
    
    def _extract_addition_line(self, line: str) -> Optional[str]:
        """Extract addition line content"""
        if line.startswith('  +'):
            return line[3:] if len(line) > 3 else ''
        elif line.startswith('+'):
            return line[1:] if len(line) > 1 else ''
        return None
    
    def _get_file_type(self, filename: str) -> str:
        """Determine file type from extension"""
        ext = Path(filename).suffix.lower()
        type_map = {
            '.tsx': 'typescript-react',
            '.ts': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript-react',
            '.css': 'css',
            '.scss': 'scss',
            '.json': 'json',
            '.py': 'python',
            '.md': 'markdown',
            '.prisma': 'prisma'
        }
        return type_map.get(ext, 'text')

class DiffApplier:
    """Applies parsed diffs to files"""
    
    def __init__(self, dry_run: bool = True):
        self.dry_run = dry_run
        self.stats = {'created': 0, 'modified': 0, 'errors': 0}
    
    def apply_patches(self, patches: List[Dict]) -> None:
        """Apply all patches"""
        for patch in patches:
            try:
                if patch['is_new_file']:
                    self._create_new_file(patch)
                else:
                    self._modify_existing_file(patch)
            except Exception as e:
                print(f"❌ Error processing {patch['filename']}: {e}")
                self.stats['errors'] += 1
    
    def _create_new_file(self, patch: Dict) -> None:
        """Create a new file"""
        filename = patch['filename']
        content = patch['new_content']
        
        if os.path.exists(filename):
            print(f"⚠️  File {filename} already exists, skipping creation.")
            return
        
        if self.dry_run:
            print(f"🆕 Would create: {filename}")
            if content:
                lines = content.split('\n')
                print(f"   📄 Content: {len(lines)} lines")
                for i, line in enumerate(lines[:4]):
                    preview = line[:70] + ('...' if len(line) > 70 else '')
                    print(f"      {i+1:2}: {preview}")
                if len(lines) > 4:
                    print(f"      ... and {len(lines)-4} more lines")
            else:
                print("   ❌ No content extracted")
        else:
            # Create directory if needed
            directory = os.path.dirname(filename)
            if directory:
                os.makedirs(directory, exist_ok=True)
            
            if content:
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"✅ Created: {filename}")
                self.stats['created'] += 1
            else:
                print(f"❌ No content for: {filename}")
    
    def _modify_existing_file(self, patch: Dict) -> None:
        """Modify an existing file by applying changes"""
        filename = patch['filename']
        changes = patch['changes']
        
        if not os.path.exists(filename):
            print(f"❌ File not found: {filename}")
            return
        
        if self.dry_run:
            print(f"✏️  Would modify: {filename}")
            print(f"   📝 Changes: {len(changes)} blocks")
            for i, change in enumerate(changes[:3]):
                lines = change.split('\n')
                preview = lines[0][:60] + ('...' if len(lines[0]) > 60 else '')
                print(f"      + Block {i+1}: {preview}")
                if len(lines) > 1:
                    print(f"        ({len(lines)} lines total)")
            if len(changes) > 3:
                print(f"      ... and {len(changes)-3} more blocks")
            return
        
        # Create backup
        backup_file(filename)
        
        # Read existing file
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Apply changes based on file type
        if filename.endswith('.css'):
            content = self._apply_css_changes(content, changes)
        elif filename.endswith('.prisma'):
            content = self._apply_prisma_changes(content, changes)
        else:
            content = self._apply_code_changes(content, changes, filename)
        
        # Write modified content back
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ Modified: {filename}")
        self.stats['modified'] += 1
    
    def _apply_prisma_changes(self, content: str, changes: List[str]) -> str:
        """Apply changes to Prisma schema files"""
        lines = content.split('\n')
        
        for change_block in changes:
            change_lines = change_block.strip().split('\n')
            
            # Find the model or section to modify
            for change_line in change_lines:
                if change_line.strip() and not change_line.strip().startswith('//'):
                    # Add to end of appropriate model
                    if 'productId' in change_line or 'product' in change_line:
                        # Find Bid model and add before closing brace
                        for i, line in enumerate(lines):
                            if 'model Bid' in line:
                                # Find the closing brace of this model
                                brace_count = 0
                                for j in range(i, len(lines)):
                                    if '{' in lines[j]:
                                        brace_count += 1
                                    if '}' in lines[j]:
                                        brace_count -= 1
                                        if brace_count == 0:
                                            # Insert before closing brace
                                            lines[j:j] = ['  ' + change_line]
                                            break
                                break
        
        return '\n'.join(lines)
    
    def _apply_css_changes(self, content: str, changes: List[str]) -> str:
        """Apply changes to CSS files"""
        lines = content.split('\n')
        
        # Find the @layer components section or add it
        layer_start = -1
        layer_end = -1
        
        for i, line in enumerate(lines):
            if '@layer components' in line:
                layer_start = i
            elif layer_start != -1 and line.strip() == '}' and layer_end == -1:
                layer_end = i
                break
        
        # If @layer components exists, insert before the closing brace
        if layer_start != -1 and layer_end != -1:
            for change_block in changes:
                change_lines = change_block.split('\n')
                lines[layer_end:layer_end] = ['  ' + line for line in change_lines if line.strip()]
        else:
            # Add @layer components block
            lines.extend(['', '@layer components {'])
            for change_block in changes:
                change_lines = change_block.split('\n')
                lines.extend(['  ' + line for line in change_lines if line.strip()])
            lines.append('}')
        
        return '\n'.join(lines)
    
    def _apply_code_changes(self, content: str, changes: List[str], filename: str) -> str:
        """Apply changes to code files (TS, TSX, JS)"""
        lines = content.split('\n')
        
        for change_block in changes:
            change_lines = change_block.split('\n')
            
            if not change_lines:
                continue
            
            first_line = change_lines[0].strip()
            
            # Handle imports
            if first_line.startswith('import '):
                self._insert_import(lines, change_lines)
            
            # Handle destructuring assignments
            elif 'const {' in change_block and '} = req.body' in change_block:
                self._update_destructuring(lines, change_block)
            
            # Handle other changes by appending or inserting appropriately
            else:
                # Find appropriate insertion point
                self._insert_code_intelligently(lines, change_lines)
        
        return '\n'.join(lines)
    
    def _insert_import(self, lines: List[str], import_lines: List[str]) -> None:
        """Insert import statement after existing imports"""
        last_import_idx = -1
        for i, line in enumerate(lines):
            if line.strip().startswith('import '):
                last_import_idx = i
        
        if last_import_idx != -1:
            lines[last_import_idx + 1:last_import_idx + 1] = import_lines
        else:
            # Insert at top after 'use client' if present
            insert_idx = 1 if lines and "'use client'" in lines[0] else 0
            lines[insert_idx:insert_idx] = import_lines + ['']
    
    def _update_destructuring(self, lines: List[str], change_block: str) -> None:
        """Update destructuring assignment to include new variables"""
        for i, line in enumerate(lines):
            if 'const {' in line and '} = req.body' in line:
                # Extract new variables from change_block
                if 'productId' in change_block:
                    # Add productId to existing destructuring
                    lines[i] = line.replace('} = req.body', ', productId } = req.body')
                break
    
    def _insert_code_intelligently(self, lines: List[str], code_lines: List[str]) -> None:
        """Insert code at appropriate location"""
        # This is a simplified approach - for production use, you'd want more sophisticated logic
        # For now, append to end
        lines.extend([''] + code_lines)
    
    def print_summary(self) -> None:
        """Print summary statistics"""
        if self.dry_run:
            print(f"\n✅ Dry run complete. No files were modified.")
        else:
            print(f"\n🎉 Summary: {self.stats['created']} created, {self.stats['modified']} modified, {self.stats['errors']} errors")

def main():
    parser = argparse.ArgumentParser(
        description="Generic diff parser and applier - supports both custom and unified diff formats"
    )
    parser.add_argument('diff_file', help='Diff file to process')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Preview changes without modifying files')
    parser.add_argument('--create-only', action='store_true',
                       help='Only create new files, skip modifications')
    parser.add_argument('--format', choices=['auto', 'custom', 'unified'],
                       default='auto', help='Force specific diff format')
    parser.add_argument('--output-format', choices=['text', 'json'],
                       default='text', help='Output format for results')
    
    args = parser.parse_args()
    
    if not os.path.isfile(args.diff_file):
        print(f"❌ Diff file '{args.diff_file}' not found.")
        sys.exit(1)
    
    # Parse the diff
    diff_parser = DiffParser()
    try:
        patches = diff_parser.parse_file(args.diff_file)
        
        if not patches:
            print("❌ No patches found. Check diff file format.")
            sys.exit(1)
        
        # Output results
        if args.output_format == 'json':
            print(json.dumps(patches, indent=2))
            return
        
        # Apply patches
        applier = DiffApplier(dry_run=args.dry_run)
        
        print(f"🔍 Processing {len(patches)} files from diff...")
        print("=" * 60)
        
        applier.apply_patches(patches)
        applier.print_summary()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()


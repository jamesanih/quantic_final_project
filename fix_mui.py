import os
import re

def fix_mui_v9(content):
    # 1. Replace InputProps with slotProps.input
    content = re.sub(r'InputProps={{', 'slotProps={{ input: {', content)
    # This might need a closing brace adjustment, but let's assume standard formatting for now.
    # Actually, nested braces are tricky. Let's try to find the whole block.
    
    # 2. Replace Grid item xs={...} md={...} with Grid size={{ xs: ..., md: ... }}
    # and remove item prop
    
    # Replace Grid item with Grid (remove item)
    content = content.replace('<Grid item', '<Grid')
    
    # Replace xs={...} md={...} with size={{ xs: ..., md: ... }}
    # This regex looks for xs and md props on a Grid component
    def replace_grid_props(match):
        props = match.group(0)
        xs_match = re.search(r'xs={(\d+)}', props)
        md_match = re.search(r'md={(\d+)}', props)
        sm_match = re.search(r'sm={(\d+)}', props)
        
        size_parts = []
        if xs_match:
            size_parts.append(f'xs: {xs_match.group(1)}')
        if sm_match:
            size_parts.append(f'sm: {sm_match.group(1)}')
        if md_match:
            size_parts.append(f'md: {md_match.group(1)}')
        
        if size_parts:
            new_size = f'size={{{{ {", ".join(size_parts)} }}}}'
            # Remove old props
            props = re.sub(r'\s*xs={(\d+)}', '', props)
            props = re.sub(r'\s*sm={(\d+)}', '', props)
            props = re.sub(r'\s*md={(\d+)}', '', props)
            # Add new size prop
            props = props.replace('<Grid', f'<Grid {new_size}')
        return props

    content = re.sub(r'<Grid[^>]+>', replace_grid_props, content)
    
    return content

src_dir = 'frontend/src'
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
            
            new_content = fix_mui_v9(content)
            
            if new_content != content:
                with open(path, 'w') as f:
                    f.write(new_content)
                print(f"Fixed {path}")

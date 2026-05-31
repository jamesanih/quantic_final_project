import os

def add_safety_checks(content):
    # Fix jobs.filter
    content = content.replace('jobs.filter', '(jobs || []).filter')
    # Fix cv.extracted_data
    content = content.replace('cv.extracted_data?.skills', '(cv?.extracted_data?.skills || [])')
    content = content.replace('cv.extracted_data?.work_experiences', '(cv?.extracted_data?.work_experiences || [])')
    return content

src_dir = 'frontend/src'
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
            
            new_content = add_safety_checks(content)
            
            if new_content != content:
                with open(path, 'w') as f:
                    f.write(new_content)
                print(f"Added safety checks to {path}")

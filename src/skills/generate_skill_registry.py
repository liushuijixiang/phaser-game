import re

INPUT_FILE = 'Skill.js'
REGISTRY_OUTPUT = 'SkillRegistry.js'

def extract_classes_and_weights(js_code):

    # 移除多行注释
    js_code = re.sub(r'/\*[\s\S]*?\*/', '', js_code)
    # 移除单行注释
    js_code = re.sub(r'//.*', '', js_code)

    classes = re.findall(r'export\s+class\s+(\w+)\s+extends\s+\w+\s*{([^}]*)}', js_code)
    results = []
    for class_name, class_body in classes:
        weight_match = re.search(r'static\s+weight\s*=\s*(\d+)', class_body)
        weight = int(weight_match.group(1)) if weight_match else 10  # 默认权重为10
        results.append((class_name, weight))
    return results

def generate_registry_code(classes):
    imports = f"import {{ {', '.join([cls for cls, _ in classes])} }} from './Skill.js';\n\n"
    registry = "export const SkillRegistry = [\n"
    for class_name, weight in classes:
        registry += f"  {{ class: {class_name}, weight: {weight} }},\n"
    registry += "];\n"
    return imports + registry

def main():
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        js_code = f.read()

    classes = extract_classes_and_weights(js_code)
    if not classes:
        print("❌ 没有找到 export class 定义！")
        return

    registry_code = generate_registry_code(classes)

    with open(REGISTRY_OUTPUT, 'w', encoding='utf-8') as f:
        f.write(registry_code)
        print(f"✅ 已生成 {REGISTRY_OUTPUT}")

if __name__ == '__main__':
    main()

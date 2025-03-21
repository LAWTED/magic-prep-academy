# 更新其他生成器组件的模板

以下是更新其他生成器组件（DialogueGenerator, FillInTheBlankGenerator, MatchingGenerator）的模板和步骤：

## 1. 移除不必要的导入

```typescript
// 移除这一行
import { parseAIGeneratedJson, validators } from "@/app/utils/jsonParser";
```

## 2. 更新API请求

将`validator`参数改为`validator_name`：

```typescript
const response = await fetch("/api/vector-chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    vectorStoreId,
    prompt: MATERIAL_PROMPTS.GENERATE_XXX, // 保持不变
    validator_name: "xxx", // 使用对应的validator名称，例如"dialogue", "fillInTheBlank", "matching"
  }),
});
```

## 3. 简化处理逻辑

移除客户端解析代码，简化为：

```typescript
const data = await response.json();

// 检查API是否返回了解析后的内容
if (data.response.parsed_content) {
  setContent(data.response.parsed_content);
  setIsGenerated(true);
} else if (data.parse_error) {
  // API尝试解析但失败了
  setError("Failed to parse content: " + data.parse_error);
} else {
  // API没有尝试解析
  setError("Failed to generate valid content. Please try again.");
}
```

## 4. validator_name对应表

以下是每个组件应使用的validator_name：

- DialogueGenerator: `"dialogue"`
- FillInTheBlankGenerator: `"fillInTheBlank"`
- MatchingGenerator: `"matching"`
- MultipleChoiceGenerator: `"multipleChoice"`

## 5. 更新后的好处

1. **简化客户端逻辑**：客户端不再需要处理复杂的JSON解析
2. **统一错误处理**：所有解析错误都在服务器端处理
3. **减少代码重复**：避免在每个组件中重复相同的解析逻辑
4. **一致的响应格式**：无论是哪种内容类型，API响应格式都是一致的

通过这些更改，我们将JSON解析的责任完全转移到了服务器端，简化了客户端代码，并提供了更一致的错误处理机制。
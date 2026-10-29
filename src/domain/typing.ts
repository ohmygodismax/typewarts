export const accuracy = (correct: number, attempts: number) =>
  attempts ? Math.round((correct / attempts) * 100) : 100;
export function finger(key: string) {
  const groups = [
    ["йфя", "левый мизинец"],
    ["цыч", "левый безымянный"],
    ["увс", "левый средний"],
    ["камипе", "левый указательный"],
    ["нртгоь", "правый указательный"],
    ["шлб", "правый средний"],
    ["щдю", "правый безымянный"],
    ["зжэхъё", "правый мизинец"],
    [" ", "большой палец"],
  ];
  return (
    groups.find(([keys]) => keys.includes(key.toLowerCase()))?.[1] ||
    "указательный палец"
  );
}

function pickLabelsFromName(imageUrl = "") {
  const lower = imageUrl.toLowerCase();
  const tags = [];
  if (lower.includes("beach")) tags.push("beach", "sunset");
  if (lower.includes("food")) tags.push("food", "restaurant");
  if (lower.includes("dog")) tags.push("dog", "pet");
  if (lower.includes("cat")) tags.push("cat", "pet");
  if (tags.length === 0) tags.push("lifestyle", "daily");
  return tags;
}

export async function mockGenerateDescription(imageUrl = "") {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const labels = pickLabelsFromName(imageUrl);
  return `Captured moment featuring ${labels[0]} vibes with ${labels[1]} details, ready for sharing.`;
}

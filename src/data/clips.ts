const clipModules = import.meta.glob("@/assets/clips/*.{gif,png}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const cookieModules = import.meta.glob(
  "@/assets/cookie/*.{jpg,jpeg,png,webp}",
  { eager: true, query: "?url", import: "default" },
) as Record<string, string>;

const list = (modules: Record<string, string>) =>
  Object.keys(modules)
    .sort()
    .map((path) => ({ url: modules[path]!, name: path.split("/").pop()! }));

export const clips = list(clipModules);
export const cookieImages = list(cookieModules);

import { peekColors, peekPalette, peekRows } from "@/data/consoleArt";

const FONT =
  'font-family: "Hack Nerd Font", Menlo, Consolas, monospace; font-size: 11px; line-height: 1.1;';

export function printConsoleEgg() {
  let text = "";
  const styles: string[] = [];
  peekRows.forEach((row, y) => {
    const colors = peekColors[y] ?? "";
    let x = 0;
    while (x < row.length) {
      const key = colors[x] ?? "-";
      let end = x + 1;
      while (end < row.length && (colors[end] ?? "-") === key) end++;
      text += `%c${row.slice(x, end).replaceAll("%", "%%")}`;
      styles.push(
        `${FONT} color: ${peekPalette[key] ?? "transparent"};${key === "Y" ? " font-weight: 700;" : ""}`,
      );
      x = end;
    }
    text += "\n";
  });
  console.log(text, ...styles);
  console.log(
    "%ci see you sneaking in the console :D",
    'font-family: "Press Start 2P", monospace; font-size: 14px; color: #fef274; background: #0e1f1c; padding: 8px 12px; border-left: 4px solid #cb6e1b; text-shadow: 2px 2px 0 #9e5212;',
  );
  console.log(
    "%cpsst… press ` on the page for the real terminal.",
    "color: #9db8b0; font-size: 11px;",
  );
}

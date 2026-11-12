# Suwannee menu → iPhone

A GitHub Action loads the public Suwannee Room menu page twice a day, reads every dish for
breakfast, brunch, lunch and dinner (today + tomorrow), and saves them as text files in `menu/`.
An iPhone Shortcut reads the file you pick and shows it.

Files: `today-breakfast.txt`, `today-brunch.txt`, `today-lunch.txt`, `today-dinner.txt`,
`today.txt` (all meals), and the same with `tomorrow-`.

## iPhone Shortcut ("Hey Siri, Suwannee") — shows the meal that's on right now

Suwannee hours: breakfast until 10:30 AM, lunch until 4:30 PM, dinner until 10 PM.
After 10 PM it shows tomorrow's breakfast. On brunch days, breakfast and lunch show brunch.

1. Shortcuts app → **+** → name it **Suwannee**.
2. Add **Current Date**.
3. Add **Format Date** → Date Format: **Custom** → `HHmm` (turns 12:37 PM into 1237).
4. Add **Get Numbers from Input**.
5. Add **If** → Numbers **is less than** `1030`
   - inside: **Text** `today-breakfast`
   - **Otherwise**: add another **If** → Numbers **is less than** `1630`
     - inside: **Text** `today-lunch`
     - **Otherwise**: add another **If** → Numbers **is less than** `2200`
       - inside: **Text** `today-dinner`
       - **Otherwise**: **Text** `tomorrow-breakfast`
6. After the last **End If**, add a **Text** action: type
   `https://raw.githubusercontent.com/guyhan10/suwannee-menu/main/menu/`
   then insert the **If Result** variable, then type `.txt`.
7. Add **Get Contents of URL**.
8. Add **Show Result**.

## Run it by hand
GitHub → Actions → "Update Suwannee menu" → Run workflow.

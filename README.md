# Suwannee menu → iPhone

A GitHub Action loads the public Suwannee Room menu page twice a day, reads every dish for
breakfast, brunch, lunch and dinner (today + tomorrow), and saves them as text files in `menu/`.
An iPhone Shortcut reads the file you pick and shows it.

Files: `today-breakfast.txt`, `today-brunch.txt`, `today-lunch.txt`, `today-dinner.txt`,
`today.txt` (all meals), and the same with `tomorrow-`.

## iPhone Shortcut ("Hey Siri, Suwannee")

1. Shortcuts app → **+** → name it **Suwannee**.
2. Add **Choose from Menu**. Prompt: `Which meal?` Items: Breakfast, Lunch, Dinner, Brunch, All today, Tomorrow.
3. Under each item add a **Text** action containing the file name:
   Breakfast → `today-breakfast` · Lunch → `today-lunch` · Dinner → `today-dinner` ·
   Brunch → `today-brunch` · All today → `today` · Tomorrow → `tomorrow`
4. After **End Menu**, add a **Text** action: type
   `https://raw.githubusercontent.com/guyhan10/suwannee-menu/main/menu/`
   then insert the **Menu Result** variable, then type `.txt`.
5. Add **Get Contents of URL** (it uses the Text above).
6. Add **Show Result**.

## Run it by hand
GitHub → Actions → "Update Suwannee menu" → Run workflow.

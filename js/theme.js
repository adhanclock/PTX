/* Light / dark theme. Dark is the default; the choice is remembered in localStorage (read
   synchronously from <head> so the popup never flashes the wrong theme). The CSS for the light
   theme lives in css/light-theme.css and keys off <html data-theme="light">. */
const THEME_KEY = 'theme';

const getTheme = () => {
    try { return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'; } catch (e) { return 'dark'; }
};

const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggle');
    if (btn) {
        btn.title = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
        btn.setAttribute('aria-pressed', theme === 'light');
    }
};

const setTheme = (theme) => {
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* unavailable: theme just won't persist */ }
    applyTheme(theme);
};

applyTheme(getTheme());
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getTheme());
    const btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', () => setTheme(getTheme() === 'light' ? 'dark' : 'light'));
});

/* "adlinks": the small cross-promo link under the elapsed time on the home tab. One is picked at
   random every time the popup opens. To add another, append an entry here (icon lives in images/). */
const adlinks = [
    { url: 'https://zakattracker.com', icon: 'images/zakattracker-logo.png', text: 'Calculate and Track Your Zakat' },
    { url: 'https://azanclock.com', icon: 'images/azanclock-logo.png', text: 'Set up your own azan clock' }
];

document.addEventListener('DOMContentLoaded', () => {
    const link = document.getElementById('adlink');
    if (!link) return;
    const ad = adlinks[Math.floor(Math.random() * adlinks.length)];
    link.href = ad.url;
    link.title = ad.url.replace('https://', '');
    document.getElementById('adlinkLogo').src = ad.icon;
    document.getElementById('adlinkText').textContent = ad.text;
    link.style.display = '';
});

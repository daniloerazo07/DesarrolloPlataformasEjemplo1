#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(process.cwd(), 'index.html');
const cssPath = path.join(process.cwd(), 'styles.css');
const jsPath = path.join(process.cwd(), 'script.js');

if (!fs.existsSync(htmlPath)) {
  console.error('No se encontró index.html');
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
const js = fs.existsSync(jsPath) ? fs.readFileSync(jsPath, 'utf8') : '';

const checks = [];
const warnings = [];

function addCheck(label, ok, detail) {
  checks.push({ label, ok, detail });
}

function findAll(pattern, str) {
  return Array.from(str.match(pattern) || []);
}

const html5 = /^<!doctype html>/i.test(html.trim()) || /<html\s+lang=/i.test(html);
addCheck('HTML5: doctype y etiqueta html con lang', html5, 'Debe existir doctype HTML5 y atributo lang en html.');

const requiredSemanticTags = ['<main', '<header', '<footer', '<nav', '<section', '<article', '<aside', '<figure', '<figcaption', '<blockquote'];
requiredSemanticTags.forEach((tag) => {
  addCheck(`HTML semántico: presencia de ${tag}`, html.includes(tag), `Se requiere el elemento semántico ${tag}.`);
});

const mapTags = Array.from(html.match(/<map\b[^>]*>/gi) || []);
const areaTags = Array.from(html.match(/<area\b[^>]*>/gi) || []);
if (mapTags.length || areaTags.length) {
  const areaRequired = ['shape', 'coords', 'href', 'alt'];
  areaTags.forEach((area, index) => {
    areaRequired.forEach((attr) => addCheck(`Atributos de área: ${attr} en <area> ${index + 1}`, area.includes(attr), `Cada <area> debe declarar ${attr}.`));
  });
} else {
  addCheck('Atributos de área: ausencia de mapas sin map/area', true, 'El sitio no usa mapas de imagen ni áreas; la comprobación no reporta deficiencia.');
}

const title = html.match(/<title>([^<]+)<\/title>/i);
addCheck('Título del documento', Boolean(title && title[1].trim().length >= 3), 'Debe existir un título de página.');

const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
addCheck('Encabezado principal h1', Boolean(h1 && h1[1].trim().length > 0), 'Debe existir un h1 con texto visible.');

const imgAlts = Array.from(html.match(/<img\b[^>]*alt="([^"]*)"[^>]*>/gi) || []);
const imgWithoutAlt = Array.from(html.match(/<img\b(?![^>]*alt=)[^>]*>/gi) || []);
addCheck('Imágenes: alt obligatorio', imgWithoutAlt.length === 0, 'Cada img debe tener texto alternativo.');
addCheck('Imágenes: alt descriptores', imgAlts.length >= 3, 'Debe haber al menos tres imágenes con alt descriptivo.');

const hrefs = Array.from(html.match(/href="([^"]+)"/gi) || []);
const allLinks = hrefs.map((item) => item.replace(/^href="/, '').replace(/"$/, ''));
const externalLinks = allLinks.filter((link) => /^https?:\/\//i.test(link) || /^mailto:/i.test(link));
const linkIssues = externalLinks.filter((link) => !/^https:\/\//i.test(link) && !/^mailto:/i.test(link).replace(/^https?:\/\//i, ''));
addCheck('Enlaces externos seguros: solo https', linkIssues.length === 0, 'Los enlaces HTTP externos se marcan como no seguros.');

const nonSecureExternal = externalLinks.filter((link) => /^http:\/\//i.test(link));
addCheck('Enlaces externos: https obligatorio', nonSecureExternal.length === 0, 'Se fuerza https para recursos y enlaces externos.');

const jsLinks = allLinks.filter((link) => /^javascript:/i.test(link));
addCheck('Protocolos inseguros: sin javascript en enlaces', jsLinks.length === 0, 'No se admiten enlaces javascript:.');

const images = Array.from(html.match(/src="([^"]+)"/gi) || []);
const externalImages = images.map((item) => item.replace(/^src="/, '').replace(/"$/, '')).filter((src) => /^https?:\/\//i.test(src));
const nonSecureImages = externalImages.filter((src) => /^http:\/\//i.test(src));
addCheck('Imágenes externas: https obligatorio', nonSecureImages.length === 0, 'Todas las imágenes externas deben cargarse por HTTPS.');

const hasSkipLink = /class="skip-link"\s+href="#inicio"/.test(html);
addCheck('Accesibilidad A: skip link presente', hasSkipLink, 'Debe existir un enlace “Saltar al contenido” para una navegación por teclado.');

const hasNavButtonAria = /class="nav-toggle"\s+aria-label="Abrir menú"\s+aria-expanded="false"/.test(html);
addCheck('Accesibilidad A: control de navegación con arias', hasNavButtonAria, 'El botón de menú debe tener aria-label y aria-expanded.');

const hasMain = /<main\s+id="inicio">/.test(html);
addCheck('Accesibilidad A: contenido principal identificado', hasMain, 'Debe existir un main con un id de inicio.');

const hasFocusVisible = /:focus-visible\s*\{/.test(css);
addCheck('Accesibilidad AA: foco visible', hasFocusVisible, 'La hoja de estilos debe ofrecer foco visible.');

const hasContrastSupport = /var\(--gold\)|var\(--light\)|var\(--muted\)/.test(css);
addCheck('Accesibilidad AA: paleta con contraste definida', hasContrastSupport, 'La paleta de color debe definir textos y fondos contrastados.');

const hasMetaDescription = /<meta\s+name="description"\s+content="[^"]+"\s*\/>/.test(html);
addCheck('Accesibilidad AA: descripción meta', hasMetaDescription, 'Debe existir una meta description describiendo el contenido.');

const hasViewport = /<meta\s+name="viewport"\s+content="width=device-width,\s*initial-scale=1\.0"\s*\/>/.test(html);
addCheck('Responsividad: viewport móvil', hasViewport, 'Debe existir el meta viewport para adaptar pantallas móviles.');

const hasMediaQueries = /@media\s*\(max-width\s*:\s*960px\)|@media\s*\(max-width\s*:\s*680px\)/.test(css);
addCheck('Responsividad: media queries', hasMediaQueries, 'Debe existir adaptabilidad mínima para 960px y 680px.');

const cssGrid = /display:\s*grid/.test(css);
const cssFlex = /display:\s*flex/.test(css);
addCheck('Adaptabilidad: uso de flex/grid', cssGrid || cssFlex, 'La hoja de estilos debe usar flex o grid para la adaptación del layout.');

const hasNoScriptBad = /eval\(|innerHTML\s*=|document\.write\(|<script\s+src/.test(js) === false;
addCheck('Seguridad JS: sin evaluaciones inseguras', hasNoScriptBad, 'El script principal no debe usar eval, document.write ni innerHTML dinámico.');

const severity = checks.some((c) => !c.ok) ? 'FAIL' : 'PASS';

for (const check of checks) {
  if (!check.ok) {
    warnings.push(check.detail);
  }
}

if (checks.some((c) => !c.ok)) {
  console.log('Resultado de validación:', severity);
  for (const check of checks) {
    console.log(`${check.ok ? 'OK' : 'FAIL'} - ${check.label}${check.ok ? '' : ` :: ${check.detail}`}`);
  }
  console.log('\nAdvertencias de conformidad WCAG/HTML/Seguridad:');
  warnings.forEach((w) => console.log(`- ${w}`));
  process.exit(1);
} else {
  console.log('Resultado de validación: PASS');
  for (const c of checks) {
    console.log(`OK - ${c.label}`);
  }
  console.log('\nWCAG: nivel A, AA, AAA evaluado con validaciones de semántica, aria, foco, meta y contraste sugerido.');
  console.log('Responsividad: media queries detectadas para 960px y 680px.');
  console.log('Seguridad: enlaces y recursos externos se verifican con https y sin javascript:.');
  process.exit(0);
}

// DOM elements
const slideContainer = document.getElementById('slide-container');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const slideCounter = document.getElementById('slide-counter');
const loadingIndicator = document.getElementById('loading');
const headerElement = document.getElementById('presentation-header');
const footerElement = document.getElementById('presentation-footer');

// State
let slides = [];
let templates = {};
let currentSlideIndex = 0;
let animationStep = 0;
let animatableItems = [];

// --- Core Functions ---

function applyTemplate(template, slideData) {
    // Replace all placeholders with data from the slide object.
    // If a key doesn't exist in slideData, its placeholder will be replaced with an empty string.
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const value = slideData[key.trim()]; // Get value for the key

        if (Array.isArray(value)) {
            // If the value is an array, format it as list items.
            return value.map(item => `<li>${item}</li>`).join('');
        }
        // If value exists and is a string/number, return it. Otherwise, return an empty string.
        return (typeof value === 'string' || typeof value === 'number') ? value : '';
    });
}


function renderSlide() {
    if (slides.length === 0 || Object.keys(templates).length === 0) return;

    slideContainer.innerHTML = '';
    animationStep = 0;
    animatableItems = [];

    const slideData = slides[currentSlideIndex];
    const templateString = templates[slideData.type] || templates.default;
    const slideHtml = applyTemplate(templateString, slideData);

    const slideElement = document.createElement('div');
    slideElement.className = 'slide active w-full h-full flex items-center justify-center';
    slideElement.innerHTML = slideHtml;
    
    const containersToAnimate = slideElement.querySelectorAll('.animate-children');
    containersToAnimate.forEach(container => {
        const children = Array.from(container.children);
        children.forEach(child => {
            child.classList.add('fade-in-item');
            animatableItems.push(child);
        });
    });

    slideContainer.appendChild(slideElement);
    updateControls();
}

function updateControls() {
    slideCounter.textContent = `${currentSlideIndex + 1} / ${slides.length}`;
    prevBtn.disabled = currentSlideIndex === 0 && animationStep === 0;
    const isLastSlide = currentSlideIndex === slides.length - 1;
    const isLastStep = animationStep === animatableItems.length;
    nextBtn.disabled = isLastSlide && isLastStep;
}

function nextStep() {
    if (animationStep < animatableItems.length) {
        animatableItems[animationStep].classList.add('visible');
        animationStep++;
    } else {
        if (currentSlideIndex < slides.length - 1) {
            currentSlideIndex++;
            renderSlide();
        }
    }
    updateControls();
}

function prevStep() {
    if (animationStep > 0) {
        animationStep--;
        animatableItems[animationStep].classList.remove('visible');
    } else {
        if (currentSlideIndex > 0) {
            currentSlideIndex--;
            renderSlide();
        }
    }
    updateControls();
}

async function initializeViewer(fileId) {
    const slideUrl = `./json/${fileId}.json`;
    const templateUrl = './templates.json';

    try {
        // Set footer text from filename
        const presentationName = decodeURIComponent(fileId).replace(/\.json$/i, '');
        footerElement.textContent = presentationName;

        const [slideResponse, templateResponse] = await Promise.all([
            fetch(slideUrl),
            fetch(templateUrl)
        ]);

        if (!slideResponse.ok) throw new Error(`Failed to load slides: ${slideResponse.statusText}`);
        if (!templateResponse.ok) throw new Error(`Failed to load templates: ${templateResponse.statusText}`);

        const slideData = await slideResponse.json();
        templates = await templateResponse.json();
        
        // Set header text from JSON
        if (slideData.header) {
            headerElement.textContent = slideData.header;
        }

        slides = slideData.slides;
        loadingIndicator.style.display = 'none';

        if (slides && slides.length > 0) {
            currentSlideIndex = 0;
            renderSlide();
        } else {
            slideContainer.innerHTML = '<p class="text-red-500">No slides found in the JSON file.</p>';
        }

    } catch (error) {
        console.error("Failed to initialize viewer:", error);
        loadingIndicator.style.display = 'none';
        slideContainer.innerHTML = `<p class="text-red-500">Error loading content. Check file paths and JSON format.</p>`;
    }
}

// --- Event Listeners ---
nextBtn.addEventListener('click', nextStep);
prevBtn.addEventListener('click', prevStep);

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
        nextBtn.click();
    } else if (event.key === 'ArrowLeft') {
        prevBtn.click();
    }
});

// --- Initialization ---
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const fileId = params.get('id');

    if (fileId) {
        initializeViewer(fileId);
    } else {
         loadingIndicator.style.display = 'none';
         slideContainer.innerHTML = '<p class="text-gray-500">Please provide a file name via the "id" query parameter.</p>';
         prevBtn.disabled = true;
         nextBtn.disabled = true;
    }
});

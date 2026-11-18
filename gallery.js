(() => {
    "use strict";

    const galleryGrid = document.getElementById("galleryGrid");
    const lightbox = document.getElementById("lightbox");
    if (!galleryGrid || !lightbox) return;

    const galleryCards = Array.from(galleryGrid.querySelectorAll(".gallery-card"));
    const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));
    const emptyState = document.getElementById("emptyState");
    const visiblePhotoCount = document.getElementById("visiblePhotoCount");
    const lightboxContent = lightbox.querySelector(".lightbox-content");
    const imageWrapper = document.getElementById("lightboxImageWrapper");
    const lightboxImage = document.getElementById("lightboxImage");
    const lightboxWebp = document.getElementById("lightboxImageWebp");
    const lightboxTitle = document.getElementById("lightboxTitle");
    const lightboxDescription = document.getElementById("lightboxDescription");
    const lightboxTag = document.getElementById("lightboxTag");
    const lightboxCounter = document.getElementById("lightboxCounter");
    const lightboxClose = document.getElementById("lightboxClose");
    const lightboxPrev = document.getElementById("lightboxPrev");
    const lightboxNext = document.getElementById("lightboxNext");
    const nav = document.getElementById("mainNav");
    const backToTop = document.getElementById("backToTop");

    let visibleCards = galleryCards.slice();
    let currentIndex = 0;
    let slideRequestId = 0;
    let previousFocus = null;
    let scrollLock = null;
    let touchStart = null;

    const categoryCounts = { all: galleryCards.length };
    galleryCards.forEach((card) => {
        const category = card.dataset.category;
        if (category) categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    document.querySelectorAll(".filter-count").forEach((count) => {
        const category = count.dataset.count;
        if (category in categoryCounts) count.textContent = categoryCounts[category];
    });

    function updateFilters(filter) {
        visibleCards = [];

        galleryCards.forEach((card) => {
            const isVisible = filter === "all" || card.dataset.category === filter;
            card.classList.toggle("hidden", !isVisible);
            if (isVisible) visibleCards.push(card);
        });

        filterButtons.forEach((button) => {
            const isActive = button.dataset.filter === filter;
            button.classList.toggle("active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });

        if (visiblePhotoCount) visiblePhotoCount.textContent = visibleCards.length;
        if (emptyState) emptyState.classList.toggle("visible", visibleCards.length === 0);
    }

    if (visiblePhotoCount) visiblePhotoCount.textContent = visibleCards.length;

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => updateFilters(button.dataset.filter || "all"));
    });

    function getCardIndex(card) {
        return visibleCards.indexOf(card);
    }

    function lockPageScroll() {
        const body = document.body;
        const root = document.documentElement;

        scrollLock = {
            top: window.scrollY,
            bodyPosition: body.style.position,
            bodyTop: body.style.top,
            bodyLeft: body.style.left,
            bodyRight: body.style.right,
            bodyWidth: body.style.width,
            bodyOverflow: body.style.overflow,
            rootOverflow: root.style.overflow
        };

        body.style.position = "fixed";
        body.style.top = "-" + scrollLock.top + "px";
        body.style.left = "0";
        body.style.right = "0";
        body.style.width = "100%";
        body.style.overflow = "hidden";
        root.style.overflow = "hidden";
    }

    function unlockPageScroll() {
        if (!scrollLock) return;

        const body = document.body;
        const root = document.documentElement;
        const savedScrollTop = scrollLock.top;

        body.style.position = scrollLock.bodyPosition;
        body.style.top = scrollLock.bodyTop;
        body.style.left = scrollLock.bodyLeft;
        body.style.right = scrollLock.bodyRight;
        body.style.width = scrollLock.bodyWidth;
        body.style.overflow = scrollLock.bodyOverflow;
        root.style.overflow = scrollLock.rootOverflow;
        scrollLock = null;
        window.scrollTo(0, savedScrollTop);
    }

    function markImageLoaded(wrapper) {
        if (!wrapper) return;
        wrapper.classList.add("image-loaded");
        wrapper.classList.remove("image-failed");
    }

    function handleThumbnailError(image) {
        const wrapper = image.closest(".gallery-card-image");
        const webpSource = image.closest("picture")?.querySelector('source[type="image/webp"]');
        if (wrapper) wrapper.classList.remove("image-loaded");

        if (!image.dataset.jpegFallbackAttempted) {
            image.dataset.jpegFallbackAttempted = "true";
            webpSource?.removeAttribute("srcset");
            image.removeAttribute("srcset");
            image.src = image.getAttribute("src");
            return;
        }

        if (!image.dataset.originalFallbackAttempted && image.dataset.originalSrc) {
            image.dataset.originalFallbackAttempted = "true";
            image.src = image.dataset.originalSrc;
            return;
        }

        wrapper?.classList.add("image-failed");
    }

    galleryGrid.addEventListener("load", (event) => {
        if (event.target instanceof HTMLImageElement) {
            markImageLoaded(event.target.closest(".gallery-card-image"));
        }
    }, true);

    galleryGrid.addEventListener("error", (event) => {
        if (event.target instanceof HTMLImageElement) handleThumbnailError(event.target);
    }, true);

    galleryCards.forEach((card) => {
        const image = card.querySelector("img");
        if (image?.complete) {
            if (image.naturalWidth > 0) markImageLoaded(image.closest(".gallery-card-image"));
            else if (image.currentSrc || image.src) handleThumbnailError(image);
        }
    });

    function setSlideImage(cardImage) {
        const imageUrl = cardImage.dataset.lightboxSrc;
        const webpUrl = cardImage.dataset.lightboxWebp;
        const originalUrl = cardImage.dataset.originalSrc;

        slideRequestId += 1;
        lightboxImage.dataset.slideRequest = String(slideRequestId);
        lightboxImage.dataset.jpegFallbackAttempted = "false";
        lightboxImage.dataset.originalFallbackAttempted = "false";
        lightboxImage.dataset.jpegFallback = imageUrl || "";
        lightboxImage.dataset.originalSrc = originalUrl || "";
        lightboxImage.alt = cardImage.alt;
        lightboxImage.removeAttribute("src");
        lightboxWebp?.removeAttribute("srcset");
        imageWrapper?.classList.remove("image-loaded", "image-failed");

        if (webpUrl && lightboxWebp) lightboxWebp.srcset = webpUrl;
        if (imageUrl) lightboxImage.src = imageUrl;
    }

    function showSlide(index) {
        if (!visibleCards.length) return;
        currentIndex = (index + visibleCards.length) % visibleCards.length;

        const card = visibleCards[currentIndex];
        const cardImage = card.querySelector("img");
        if (!cardImage) return;

        lightboxTitle.textContent = card.dataset.title || cardImage.alt;
        lightboxDescription.textContent = card.dataset.description || "";
        lightboxTag.textContent = card.querySelector(".gallery-card-tag")?.textContent.trim() || "";
        lightboxCounter.textContent = (currentIndex + 1) + " / " + visibleCards.length;
        setSlideImage(cardImage);
    }

    function openLightbox(index, trigger) {
        if (index < 0 || index >= visibleCards.length) return;

        previousFocus = trigger || document.activeElement;
        lockPageScroll();
        lightbox.classList.add("active");
        lightbox.setAttribute("aria-hidden", "false");
        showSlide(index);

        window.requestAnimationFrame(() => lightboxClose.focus({ preventScroll: true }));
    }

    function clearLightboxImage(requestId) {
        if (lightbox.classList.contains("active") || requestId !== slideRequestId) return;
        lightboxImage.removeAttribute("src");
        lightboxImage.removeAttribute("alt");
        lightboxWebp?.removeAttribute("srcset");
        imageWrapper?.classList.remove("image-loaded", "image-failed");
    }

    function closeLightbox() {
        if (!lightbox.classList.contains("active")) return;

        lightbox.classList.remove("active");
        lightbox.setAttribute("aria-hidden", "true");
        touchStart = null;
        unlockPageScroll();

        const closedRequestId = ++slideRequestId;
        window.setTimeout(() => clearLightboxImage(closedRequestId), 250);

        if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
            previousFocus.focus({ preventScroll: true });
        }
        previousFocus = null;
    }

    galleryGrid.addEventListener("click", (event) => {
        const card = event.target.closest(".gallery-card");
        if (!card || !galleryGrid.contains(card) || card.classList.contains("hidden")) return;
        openLightbox(getCardIndex(card), card);
    });

    galleryGrid.addEventListener("keydown", (event) => {
        const card = event.target.closest(".gallery-card");
        if (!card || event.target !== card || card.classList.contains("hidden")) return;
        if (event.key !== "Enter" && event.key !== " ") return;

        event.preventDefault();
        openLightbox(getCardIndex(card), card);
    });

    lightboxClose.addEventListener("click", closeLightbox);
    lightboxNext.addEventListener("click", () => showSlide(currentIndex + 1));
    lightboxPrev.addEventListener("click", () => showSlide(currentIndex - 1));
    lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) closeLightbox();
    });
    lightboxContent?.addEventListener("click", (event) => event.stopPropagation());

    lightboxImage.addEventListener("load", () => {
        if (Number(lightboxImage.dataset.slideRequest) === slideRequestId) {
            markImageLoaded(imageWrapper);
        }
    });

    lightboxImage.addEventListener("error", () => {
        if (Number(lightboxImage.dataset.slideRequest) !== slideRequestId) return;
        imageWrapper?.classList.remove("image-loaded");

        if (lightboxImage.dataset.jpegFallbackAttempted !== "true") {
            lightboxImage.dataset.jpegFallbackAttempted = "true";
            lightboxWebp?.removeAttribute("srcset");
            if (lightboxImage.dataset.jpegFallback) {
                lightboxImage.src = lightboxImage.dataset.jpegFallback;
                return;
            }
        }

        if (lightboxImage.dataset.originalFallbackAttempted !== "true" && lightboxImage.dataset.originalSrc) {
            lightboxImage.dataset.originalFallbackAttempted = "true";
            lightboxImage.src = lightboxImage.dataset.originalSrc;
            return;
        }

        imageWrapper?.classList.add("image-failed");
    });

    imageWrapper?.addEventListener("touchstart", (event) => {
        if (!lightbox.classList.contains("active") || event.touches.length !== 1) {
            touchStart = null;
            return;
        }

        const touch = event.touches[0];
        touchStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });

    imageWrapper?.addEventListener("touchmove", (event) => {
        if (!touchStart || event.touches.length !== 1 || !event.cancelable) return;
        const touch = event.touches[0];
        const deltaX = touch.clientX - touchStart.x;
        const deltaY = touch.clientY - touchStart.y;
        if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) event.preventDefault();
    }, { passive: false });

    imageWrapper?.addEventListener("touchend", (event) => {
        if (!touchStart || !lightbox.classList.contains("active")) return;

        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - touchStart.x;
        const deltaY = touch.clientY - touchStart.y;
        touchStart = null;

        if (Math.abs(deltaX) < 52 || Math.abs(deltaY) > Math.max(80, Math.abs(deltaX) * 0.75)) return;
        if (deltaX < 0) showSlide(currentIndex + 1);
        else showSlide(currentIndex - 1);
    }, { passive: true });

    imageWrapper?.addEventListener("touchcancel", () => {
        touchStart = null;
    }, { passive: true });

    document.addEventListener("keydown", (event) => {
        if (!lightbox.classList.contains("active")) return;

        if (event.key === "Escape") {
            event.preventDefault();
            closeLightbox();
            return;
        }
        if (event.key === "ArrowRight") {
            event.preventDefault();
            showSlide(currentIndex + 1);
            return;
        }
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            showSlide(currentIndex - 1);
            return;
        }
        if (event.key !== "Tab") return;

        const controls = [lightboxClose, lightboxPrev, lightboxNext];
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    imageWrapper?.addEventListener("click", (event) => event.stopPropagation());

    function handleScroll() {
        if (nav) nav.classList.toggle("scrolled", window.scrollY > 50);
        if (backToTop) backToTop.classList.toggle("visible", window.scrollY > 500);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    backToTop?.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const revealElements = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("active");
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.15 });
        revealElements.forEach((element) => revealObserver.observe(element));
    } else {
        revealElements.forEach((element) => element.classList.add("active"));
    }

    document.querySelectorAll(".navbar-nav .nav-link").forEach((link) => {
        link.addEventListener("click", () => {
            const collapse = document.getElementById("navbarContent");
            if (window.innerWidth < 992 && collapse?.classList.contains("show") && window.bootstrap?.Collapse) {
                window.bootstrap.Collapse.getOrCreateInstance(collapse).hide();
            }
        });
    });
})();

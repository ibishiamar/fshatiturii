/* ============================================================
   FSHATI TURI — SCRIPT KRYESOR
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    /* ===== 1. NAVBAR SCROLL EFFECT ===== */
    const navbar = document.getElementById("mainNav");
    if (navbar) {
        const handleNavScroll = () => {
            navbar.classList.toggle("scrolled", window.scrollY > 50);
        };
        window.addEventListener("scroll", handleNavScroll, { passive: true });
        handleNavScroll();
    }

    /* ===== 2. PHOTO MODAL (Galeria) ===== */
    // Përdorim Bootstrap Modal me data-attributes (data-bs-toggle="modal")
    // Eventi 'show.bs.modal' kap kartën që u klikua
    const photoModalEl = document.getElementById("photoModal");
    if (photoModalEl && typeof bootstrap !== "undefined") {
        photoModalEl.addEventListener("show.bs.modal", function (event) {
            const trigger = event.relatedTarget;
            if (!trigger) return;

            const title = trigger.getAttribute("data-title") || "";
            const description = trigger.getAttribute("data-description") || "";
            const imgEl = trigger.querySelector("img");
            const imgSrc = imgEl ? imgEl.src : "";
            const imgAlt = imgEl ? imgEl.alt : title;

            const modalTitle = photoModalEl.querySelector(".modal-title");
            const modalDescription = photoModalEl.querySelector("#modalDescription");
            const modalImage = photoModalEl.querySelector("#modalImage");

            if (modalTitle) modalTitle.textContent = title;
            if (modalDescription) modalDescription.textContent = description;
            if (modalImage) {
                modalImage.src = imgSrc;
                modalImage.alt = imgAlt;
            }
        });
    }

    /* ===== 3. ANIMATED COUNTER (Popullsia) ===== */
    const populationEl = document.getElementById("population");
    if (populationEl) {
        const TARGET = 500;      // Numri final
        const DURATION = 2000;   // 2 sekonda
        let hasAnimated = false;

        const animateCounter = () => {
            const startTime = performance.now();

            const step = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / DURATION, 1);
                // easing për animacion më të butë
                const eased = 1 - Math.pow(1 - progress, 3);
                populationEl.textContent = Math.floor(eased * TARGET);

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    populationEl.textContent = TARGET;
                }
            };
            requestAnimationFrame(step);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !hasAnimated) {
                    hasAnimated = true;
                    animateCounter();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(populationEl);
    }

    /* ===== 4. REVEAL ANIMATIONS ON SCROLL ===== */
    const revealElements = document.querySelectorAll(".reveal");
    if (revealElements.length) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("active");
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        revealElements.forEach((el) => revealObserver.observe(el));
    }

    /* ===== 5. BACK TO TOP BUTTON ===== */
    const backToTop = document.getElementById("backToTop");
    if (backToTop) {
        window.addEventListener("scroll", () => {
            backToTop.classList.toggle("visible", window.scrollY > 500);
        }, { passive: true });

        backToTop.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    /* ===== 6. VIDEO: VETËM NJË LUAJ NË NJË KOHË ===== */
    const videos = document.querySelectorAll("video");
    videos.forEach((video) => {
        video.addEventListener("play", () => {
            videos.forEach((v) => {
                if (v !== video && !v.paused) v.pause();
            });
        });
    });

    /* ===== 7. SMOOTH SCROLL PËR ANCHOR LINKS ===== */
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            const href = this.getAttribute("href");
            if (href && href.length > 1) {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }
        });
    });
});
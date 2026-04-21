document.body.classList.add("js-enhanced");

function ensureDefaultOverviewHash() {
    if (window.location.hash) return;
    window.history.replaceState(null, "", "#overview");
}

function copyBibTeX() {
    const bibtexElement = document.getElementById("bibtex-code");
    const button = document.querySelector(".copy-bibtex-btn");
    const copyText = button ? button.querySelector(".copy-text") : null;

    if (!bibtexElement || !button || !copyText) return;

    const value = bibtexElement.textContent;
    const onSuccess = () => {
        button.classList.add("copied");
        copyText.textContent = "Copied";
        window.setTimeout(() => {
            button.classList.remove("copied");
            copyText.textContent = "Copy";
        }, 1800);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(onSuccess).catch(() => {
            fallbackCopy(value, onSuccess);
        });
        return;
    }

    fallbackCopy(value, onSuccess);
}

function fallbackCopy(value, onSuccess) {
    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    onSuccess();
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function updateScrollButton() {
    const button = document.querySelector(".scroll-to-top");
    if (!button) return;
    if (window.scrollY > 400) {
        button.classList.add("visible");
    } else {
        button.classList.remove("visible");
    }
}

function setupReveals() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
        items.forEach((item) => item.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.16,
        rootMargin: "0px 0px -40px 0px"
    });

    items.forEach((item) => observer.observe(item));
}

function setupActiveNav() {
    const sections = Array.from(document.querySelectorAll("main section[id]"));
    const links = Array.from(document.querySelectorAll(".site-nav a"));
    if (!sections.length || !links.length || !("IntersectionObserver" in window)) return;

    const linkMap = new Map(
        links.map((link) => [link.getAttribute("href"), link])
    );

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const href = `#${entry.target.id}`;
            links.forEach((link) => link.classList.remove("is-active"));
            const activeLink = linkMap.get(href);
            if (activeLink) activeLink.classList.add("is-active");
        });
    }, {
        threshold: 0.35,
        rootMargin: "-20% 0px -55% 0px"
    });

    sections.forEach((section) => observer.observe(section));
}

function setupDeferredVideos() {
    const videos = Array.from(document.querySelectorAll(".video-player"));
    if (!videos.length) return;

    const loadVideoPreview = (video) => {
        if (video.dataset.previewQueued === "true") return;
        video.dataset.previewQueued = "true";
        video.preload = "metadata";

        const revealFirstFrame = () => {
            if (video.dataset.firstFrameReady === "true") return;
            if (!Number.isFinite(video.duration) || video.duration <= 0) return;

            const targetTime = Math.min(0.05, video.duration / 2);
            const handleSeeked = () => {
                video.pause();
                video.dataset.firstFrameReady = "true";
            };

            video.addEventListener("seeked", handleSeeked, { once: true });

            try {
                video.currentTime = targetTime;
            } catch (error) {
                video.removeEventListener("seeked", handleSeeked);
            }
        };

        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            revealFirstFrame();
            return;
        }

        video.addEventListener("loadeddata", revealFirstFrame, { once: true });
        video.load();
    };

    const isNearViewport = (video) => {
        const rect = video.getBoundingClientRect();
        return rect.top < window.innerHeight + 320 && rect.bottom > -320;
    };

    if (!("IntersectionObserver" in window)) {
        videos.filter(isNearViewport).forEach(loadVideoPreview);
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            loadVideoPreview(entry.target);
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.01,
        rootMargin: "320px 0px"
    });

    videos.forEach((video) => {
        if (isNearViewport(video)) {
            loadVideoPreview(video);
            return;
        }

        observer.observe(video);
    });
}

function setupRealismQuiz() {
    const carousel = document.getElementById("realism-carousel");
    if (!carousel) return;

    const cards = Array.from(carousel.querySelectorAll(".realism-card"));
    const currentLabels = Array.from(document.querySelectorAll("[data-realism-current]"));
    const prevButtons = Array.from(document.querySelectorAll('[data-realism-nav="prev"]'));
    const nextButtons = Array.from(document.querySelectorAll('[data-realism-nav="next"]'));
    if (!cards.length || !currentLabels.length || !prevButtons.length || !nextButtons.length) return;

    let currentIndex = 0;

    const answerLabelMap = {
        generated: "Generated",
        realistic: "Realistic"
    };

    const pauseInactiveVideos = () => {
        cards.forEach((card, index) => {
            if (index === currentIndex) return;
            const video = card.querySelector("video");
            if (video && !video.paused) video.pause();
        });
    };

    const getNearestIndex = () => {
        let nearestIndex = 0;
        let nearestDistance = Number.POSITIVE_INFINITY;

        cards.forEach((card, index) => {
            const distance = Math.abs(card.offsetLeft - carousel.scrollLeft);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = index;
            }
        });

        return nearestIndex;
    };

    const syncQuizUi = () => {
        currentLabels.forEach((label) => {
            label.textContent = String(currentIndex + 1);
        });
        prevButtons.forEach((button) => {
            button.disabled = currentIndex === 0;
        });
        nextButtons.forEach((button) => {
            button.disabled = currentIndex === cards.length - 1;
        });
        pauseInactiveVideos();
    };

    const scrollToCard = (index) => {
        currentIndex = Math.max(0, Math.min(index, cards.length - 1));
        cards[currentIndex].scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "start"
        });
        syncQuizUi();
    };

    const alignCurrentCard = () => {
        cards[currentIndex].scrollIntoView({
            behavior: "auto",
            block: "nearest",
            inline: "start"
        });
    };

    prevButtons.forEach((button) => {
        button.addEventListener("click", () => {
            scrollToCard(currentIndex - 1);
        });
    });

    nextButtons.forEach((button) => {
        button.addEventListener("click", () => {
            scrollToCard(currentIndex + 1);
        });
    });

    let scrollTimer = null;
    carousel.addEventListener("scroll", () => {
        window.clearTimeout(scrollTimer);
        scrollTimer = window.setTimeout(() => {
            currentIndex = getNearestIndex();
            syncQuizUi();
        }, 80);
    }, { passive: true });

    window.addEventListener("resize", () => {
        alignCurrentCard();
    });

    cards.forEach((card) => {
        const buttons = Array.from(card.querySelectorAll(".realism-answer-button"));
        const feedback = card.querySelector(".realism-feedback");
        const correctAnswer = card.dataset.answer;
        if (!feedback || !correctAnswer) return;

        buttons.forEach((button) => {
            button.addEventListener("click", () => {
                if (card.dataset.answered === "true") return;

                const chosenAnswer = button.dataset.choice;
                const isCorrect = chosenAnswer === correctAnswer;

                card.dataset.answered = "true";
                feedback.classList.remove("is-correct", "is-wrong", "is-visible");
                feedback.innerHTML = "";
                feedback.hidden = false;
                feedback.innerHTML = isCorrect
                    ? `
                        <div class="realism-feedback-status">
                            <span class="realism-feedback-badge">Correct</span>
                            <span>Congratulations, you are correct.</span>
                        </div>
                        <div class="realism-feedback-body">
                            <div class="realism-feedback-row">
                                <span class="realism-feedback-label">Answer</span>
                                <span class="realism-feedback-value">${answerLabelMap[correctAnswer]}</span>
                            </div>
                        </div>
                    `
                    : `
                        <div class="realism-feedback-status">
                            <span class="realism-feedback-badge">Answer Revealed</span>
                            <span>Not quite, please check the following answer.</span>
                        </div>
                        <div class="realism-feedback-body">
                            <div class="realism-feedback-row">
                                <span class="realism-feedback-label">Your choice</span>
                                <span class="realism-feedback-value">${answerLabelMap[chosenAnswer]}</span>
                            </div>
                            <div class="realism-feedback-row">
                                <span class="realism-feedback-label">Correct answer</span>
                                <span class="realism-feedback-value">${answerLabelMap[correctAnswer]}</span>
                            </div>
                        </div>
                    `;
                feedback.classList.add(isCorrect ? "is-correct" : "is-wrong");
                window.requestAnimationFrame(() => {
                    feedback.classList.add("is-visible");
                });

                buttons.forEach((choiceButton) => {
                    choiceButton.disabled = true;
                    choiceButton.classList.toggle("is-selected", choiceButton === button);
                    choiceButton.classList.toggle("is-correct", choiceButton.dataset.choice === correctAnswer);
                    choiceButton.classList.toggle("is-wrong", choiceButton === button && !isCorrect);
                });
            });
        });
    });

    syncQuizUi();
}

function setupRealismOverviewModal() {
    const modal = document.getElementById("realism-overview-modal");
    const openButton = document.querySelector("[data-realism-overview-open]");
    const closeButtons = document.querySelectorAll("[data-realism-overview-close]");
    if (!modal || !openButton || !closeButtons.length) return;

    const openModal = () => {
        modal.hidden = false;
        document.body.style.overflow = "hidden";
    };

    const closeModal = () => {
        modal.hidden = true;
        document.body.style.overflow = "";
    };

    openButton.addEventListener("click", openModal);
    closeButtons.forEach((button) => {
        button.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });
}

function setupUtilityOverviewModal() {
    const modal = document.getElementById("utility-overview-modal");
    const openButton = document.querySelector("[data-utility-overview-open]");
    const closeButtons = document.querySelectorAll("[data-utility-overview-close]");
    if (!modal || !openButton || !closeButtons.length) return;

    const openModal = () => {
        modal.hidden = false;
        document.body.style.overflow = "hidden";
    };

    const closeModal = () => {
        modal.hidden = true;
        document.body.style.overflow = "";
    };

    openButton.addEventListener("click", openModal);
    closeButtons.forEach((button) => {
        button.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });
}

function setupUtilityQuiz() {
    const carousel = document.getElementById("utility-carousel");
    if (!carousel) return;

    const cards = Array.from(carousel.querySelectorAll(".utility-card"));
    const currentLabels = Array.from(document.querySelectorAll("[data-utility-current]"));
    const prevButtons = Array.from(document.querySelectorAll('[data-utility-nav="prev"]'));
    const nextButtons = Array.from(document.querySelectorAll('[data-utility-nav="next"]'));
    if (!cards.length || !currentLabels.length || !prevButtons.length || !nextButtons.length) return;

    let currentIndex = 0;

    const typeLabelMap = {
        generated: "Generated",
        realistic: "Realistic",
        equal: "Equal"
    };

    const getNearestIndex = () => {
        let nearestIndex = 0;
        let nearestDistance = Number.POSITIVE_INFINITY;

        cards.forEach((card, index) => {
            const distance = Math.abs(card.offsetLeft - carousel.scrollLeft);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = index;
            }
        });

        return nearestIndex;
    };

    const syncQuizUi = () => {
        currentLabels.forEach((label) => {
            label.textContent = String(currentIndex + 1);
        });
        prevButtons.forEach((button) => {
            button.disabled = currentIndex === 0;
        });
        nextButtons.forEach((button) => {
            button.disabled = currentIndex === cards.length - 1;
        });
    };

    const scrollToCard = (index) => {
        currentIndex = Math.max(0, Math.min(index, cards.length - 1));
        cards[currentIndex].scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "start"
        });
        syncQuizUi();
    };

    const alignCurrentCard = () => {
        cards[currentIndex].scrollIntoView({
            behavior: "auto",
            block: "nearest",
            inline: "start"
        });
    };

    prevButtons.forEach((button) => {
        button.addEventListener("click", () => {
            scrollToCard(currentIndex - 1);
        });
    });

    nextButtons.forEach((button) => {
        button.addEventListener("click", () => {
            scrollToCard(currentIndex + 1);
        });
    });

    let scrollTimer = null;
    carousel.addEventListener("scroll", () => {
        window.clearTimeout(scrollTimer);
        scrollTimer = window.setTimeout(() => {
            currentIndex = getNearestIndex();
            syncQuizUi();
        }, 80);
    }, { passive: true });

    window.addEventListener("resize", () => {
        alignCurrentCard();
    });

    cards.forEach((card) => {
        const buttons = Array.from(card.querySelectorAll(".utility-answer-button"));
        const feedback = card.querySelector(".utility-feedback");
        if (!feedback || !buttons.length) return;

        const counts = {
            generated: Number(card.dataset.expertGenerated || 0),
            realistic: Number(card.dataset.expertRealistic || 0),
            equal: Number(card.dataset.expertEqual || 0)
        };

        const tallyParts = Object.entries(counts)
            .filter(([, count]) => count > 0)
            .map(([label, count]) => `${count} ${typeLabelMap[label]}`);

        buttons.forEach((button) => {
            button.addEventListener("click", () => {
                if (card.dataset.answered === "true") return;

                const rawChoice = button.dataset.choice;
                const selectedType = rawChoice === "left"
                    ? card.dataset.leftType
                    : rawChoice === "right"
                        ? card.dataset.rightType
                        : "equal";
                const agreementCount = counts[selectedType] || 0;
                const majorityType = card.dataset.expertMajority;
                const isMajorityMatch = selectedType === majorityType;

                card.dataset.answered = "true";
                feedback.classList.remove("is-correct", "is-wrong", "is-visible");
                feedback.innerHTML = "";
                feedback.hidden = false;
                feedback.innerHTML = `
                    <div class="utility-feedback-status">
                        <span class="utility-feedback-badge">${isMajorityMatch ? "Expert Match" : "Expert Reveal"}</span>
                        <span>You chose the <strong>${typeLabelMap[selectedType]}</strong> clip.</span>
                    </div>
                    <div class="utility-feedback-body">
                        <div class="utility-feedback-row">
                            <span class="utility-feedback-label">Experts who agreed with you</span>
                            <span class="utility-feedback-value">${agreementCount} / 5 experts</span>
                        </div>
                        <div class="utility-feedback-row">
                            <span class="utility-feedback-label">Majority expert choice</span>
                            <span class="utility-feedback-value">${typeLabelMap[majorityType]}</span>
                        </div>
                        <div class="utility-feedback-row">
                            <span class="utility-feedback-label">Expert vote split</span>
                            <span class="utility-feedback-value">${tallyParts.join(", ")}</span>
                        </div>
                    </div>
                `;
                feedback.classList.add(isMajorityMatch ? "is-correct" : "is-wrong");
                window.requestAnimationFrame(() => {
                    feedback.classList.add("is-visible");
                });

                buttons.forEach((choiceButton) => {
                    choiceButton.disabled = true;
                    choiceButton.classList.toggle("is-selected", choiceButton === button);
                    if (choiceButton.dataset.choice === "equal") {
                        choiceButton.classList.toggle("is-correct", majorityType === "equal");
                        choiceButton.classList.toggle("is-wrong", choiceButton === button && majorityType !== "equal");
                        return;
                    }

                    const choiceType = choiceButton.dataset.choice === "left" ? card.dataset.leftType : card.dataset.rightType;
                    choiceButton.classList.toggle("is-correct", choiceType === majorityType);
                    choiceButton.classList.toggle("is-wrong", choiceButton === button && selectedType !== majorityType);
                });
            });
        });
    });

    syncQuizUi();
}

const ACTION_VIS_DATA = [
    { action: "Pass", count: 1403863, type: "attacking" },
    { action: "Control", count: 1339852, type: "attacking" },
    { action: "Ball recovery", count: 132566, type: "defending" },
    { action: "Ball touch", count: 95823, type: "neutral" },
    { action: "Clearance", count: 56847, type: "defending" },
    { action: "Tackle", count: 49895, type: "defending" },
    { action: "Aerial", count: 42962, type: "attacking" },
    { action: "Attempt", count: 36341, type: "attacking" },
    { action: "Foul", count: 32013, type: "attacking" },
    { action: "Take On", count: 30118, type: "attacking" },
    { action: "Dispossessed", count: 25617, type: "attacking" },
    { action: "Interception", count: 25527, type: "defending" },
    { action: "Challenge", count: 22091, type: "defending" },
    { action: "Save", count: 18925, type: "defending" },
    { action: "Keeper pick-up", count: 18218, type: "defending" },
    { action: "Pass - Corner", count: 15046, type: "attacking" },
    { action: "Offside provoked", count: 5262, type: "defending" },
    { action: "Blocked Pass", count: 4084, type: "defending" },
    { action: "Goal", count: 4028, type: "attacking" },
    { action: "50/50", count: 4009, type: "attacking" },
    { action: "Drop of Ball", count: 2640, type: "attacking" },
    { action: "Claim", count: 2338, type: "defending" },
    { action: "Shield ball opp", count: 1756, type: "defending" },
    { action: "Keeper Sweeper", count: 1533, type: "defending" },
    { action: "Punch", count: 1138, type: "defending" },
    { action: "Error", count: 1025, type: "defending" },
    { action: "Other", count: 373, type: "neutral" },
    { action: "Shot - Penalty", count: 327, type: "attacking" },
    { action: "Smother", count: 283, type: "defending" },
    { action: "Good skill", count: 99, type: "attacking" }
];

const ACTION_TYPE_META = {
    all: { label: "All actions", color: "#255a8c" },
    attacking: { label: "Attacking", color: "#e5b0b8" },
    defending: { label: "Defending", color: "#a8c4e0" },
    neutral: { label: "Neutral", color: "#e1d0b4" }
};

const TRAJECTORY_HEATMAP = [
    [521, 1117, 1602, 1596, 3593, 4066, 4564, 7755, 9674, 13647, 11309, 9145, 6855, 4039, 3055],
    [550, 723, 1467, 2289, 3794, 6234, 9516, 13654, 18199, 24148, 17183, 15186, 12085, 4805, 1262],
    [146, 857, 3120, 3784, 7267, 8180, 15178, 21965, 23696, 20768, 19304, 17667, 12132, 6293, 1468],
    [670, 3089, 9031, 7384, 8538, 11747, 17508, 25868, 25576, 23834, 23414, 21699, 19311, 12829, 3273],
    [5332, 14836, 18886, 13651, 9767, 14448, 21832, 30234, 23746, 20994, 23919, 24394, 29609, 40976, 29495],
    [7589, 13312, 12936, 12374, 9905, 13584, 19763, 27343, 26652, 22190, 21509, 25394, 31239, 40289, 22651],
    [769, 2846, 5108, 8305, 11022, 13573, 18041, 23830, 19360, 18376, 18584, 16443, 16632, 9868, 2554],
    [348, 1740, 3115, 5468, 8836, 12192, 14363, 18075, 16597, 14777, 11776, 10186, 5878, 2740, 1586],
    [1069, 1509, 3605, 5697, 8093, 11120, 11656, 9815, 10432, 11515, 9454, 7421, 4466, 3312, 1620],
    [315, 2037, 1975, 2818, 4555, 6060, 7147, 6008, 5246, 5318, 5450, 4516, 3535, 3294, 2676]
];

const TRAJECTORY_SAMPLE_POINTS = [
    { x: 24.3, y: 31.6 }, { x: 74.0, y: 20.9 }, { x: 77.7, y: 12.3 }, { x: 83.0, y: 20.0 },
    { x: 91.2, y: 38.2 }, { x: 48.1, y: 42.0 }, { x: 67.7, y: 34.4 }, { x: 78.9, y: 12.7 },
    { x: 54.3, y: 44.4 }, { x: 60.1, y: 49.3 }, { x: 91.6, y: 46.8 }, { x: 49.4, y: 43.4 },
    { x: 62.2, y: 34.1 }, { x: 71.0, y: 58.9 }, { x: 27.5, y: 49.5 }, { x: 68.0, y: 21.2 },
    { x: 76.1, y: 23.1 }, { x: 38.2, y: 31.3 }, { x: 33.0, y: 38.1 }, { x: 89.2, y: 36.4 },
    { x: 20.5, y: 15.7 }, { x: 58.4, y: 47.6 }, { x: 67.5, y: 17.3 }, { x: 42.5, y: 20.9 },
    { x: 66.5, y: 30.1 }, { x: 83.5, y: 39.1 }, { x: 30.6, y: 26.3 }, { x: 40.0, y: 3.8 },
    { x: 48.5, y: 8.0 }, { x: 98.6, y: 24.9 }, { x: 93.1, y: 33.1 }, { x: 45.0, y: 31.9 },
    { x: 59.1, y: 35.6 }, { x: 3.0, y: 31.6 }, { x: 12.0, y: 28.3 }, { x: 26.6, y: 62.2 },
    { x: 69.0, y: 51.5 }, { x: 16.8, y: 31.5 }, { x: 57.8, y: 37.8 }, { x: 63.7, y: 65.2 },
    { x: 64.5, y: 43.1 }, { x: 92.3, y: 43.3 }, { x: 33.7, y: 16.9 }, { x: 70.4, y: 38.9 },
    { x: 86.3, y: 24.4 }, { x: 45.6, y: 19.1 }, { x: 50.3, y: 59.3 }, { x: 74.0, y: 63.0 },
    { x: 74.3, y: 44.6 }, { x: 91.7, y: 22.2 }, { x: 10.3, y: 32.0 }, { x: 47.5, y: 7.3 },
    { x: 71.8, y: 42.2 }, { x: 78.2, y: 34.6 }, { x: 44.9, y: 40.2 }, { x: 77.8, y: 22.3 },
    { x: 53.7, y: 42.5 }, { x: 11.5, y: 31.9 }, { x: 93.0, y: 32.2 }, { x: 87.6, y: 41.6 },
    { x: 95.0, y: 43.0 }, { x: 93.9, y: 40.2 }, { x: 77.0, y: 50.3 }, { x: 62.3, y: 56.1 },
    { x: 51.4, y: 11.2 }, { x: 37.2, y: 51.6 }, { x: 80.4, y: 49.7 }, { x: 87.4, y: 26.6 },
    { x: 91.2, y: 38.2 }, { x: 48.5, y: 40.1 }, { x: 64.3, y: 33.9 }, { x: 55.2, y: 7.6 },
    { x: 47.5, y: 57.4 }, { x: 61.7, y: 41.7 }, { x: 69.4, y: 61.9 }, { x: 58.7, y: 13.6 },
    { x: 40.0, y: 45.3 }, { x: 55.1, y: 61.3 }, { x: 83.0, y: 32.2 }, { x: 98.8, y: 35.5 },
    { x: 66.1, y: 12.0 }, { x: 62.7, y: 31.7 }, { x: 73.9, y: 15.1 }, { x: 22.8, y: 36.8 },
    { x: 39.7, y: 32.8 }, { x: 57.2, y: 42.4 }, { x: 25.8, y: 51.3 }, { x: 63.8, y: 47.4 },
    { x: 68.9, y: 18.4 }, { x: 22.8, y: 47.7 }, { x: 94.3, y: 57.8 }, { x: 80.5, y: 16.7 },
    { x: 14.2, y: 25.3 }, { x: 77.5, y: 41.2 }, { x: 82.6, y: 53.3 }, { x: 69.8, y: 31.5 }
];

function formatCompactNumber(value) {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2).replace(/\.00$/, "")}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    return String(value);
}

function formatFullNumber(value) {
    return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value, digits = 1) {
    return `${value.toFixed(digits).replace(/\.0$/, "")}%`;
}

function setupEventVisualizer() {
    const root = document.querySelector("[data-event-visualizer]");
    if (!root) return;

    const chart = root.querySelector("[data-event-chart]");
    const limitInput = root.querySelector("[data-event-limit]");
    const limitValue = root.querySelector("[data-event-limit-value]");
    const filterButtons = Array.from(root.querySelectorAll("[data-event-filter]"));
    const activeName = root.querySelector("[data-event-active-name]");
    const activeCount = root.querySelector("[data-event-active-count]");
    const activeShare = root.querySelector("[data-event-active-share]");
    const activeCum = root.querySelector("[data-event-active-cum]");
    const activeType = root.querySelector("[data-event-active-type]");
    const typeSummary = root.querySelector("[data-event-type-summary]");
    if (!chart || !limitInput || !limitValue || !activeName || !activeCount || !activeShare || !activeCum || !activeType || !typeSummary) return;

    const totalCount = ACTION_VIS_DATA.reduce((sum, item) => sum + item.count, 0);
    const typeTotals = ["attacking", "defending", "neutral"].map((key) => ({
        key,
        label: ACTION_TYPE_META[key].label,
        count: ACTION_VIS_DATA.filter((item) => item.type === key).reduce((sum, item) => sum + item.count, 0)
    }));

    const state = {
        filter: "all",
        limit: Number(limitInput.value),
        activeAction: "Pass"
    };

    const getFilteredData = () => {
        const filtered = state.filter === "all"
            ? ACTION_VIS_DATA.slice()
            : ACTION_VIS_DATA.filter((item) => item.type === state.filter);

        const sorted = filtered.sort((a, b) => b.count - a.count);
        let cumulative = 0;
        return sorted.map((item, index) => {
            cumulative += item.count;
            return {
                ...item,
                rank: index + 1,
                share: item.count / totalCount * 100,
                cumulativeShare: cumulative / totalCount * 100
            };
        });
    };

    const updateInspector = (item) => {
        activeName.textContent = item.action;
        activeCount.textContent = formatFullNumber(item.count);
        activeShare.textContent = formatPercent(item.share, item.share < 1 ? 2 : 1);
        activeCum.textContent = formatPercent(item.cumulativeShare, 1);
        activeType.textContent = ACTION_TYPE_META[item.type].label;
    };

    const renderTypeSummary = () => {
        typeSummary.innerHTML = typeTotals.map((item) => `
            <div class="dataset-summary-chip${state.filter === item.key ? " is-active" : ""}">
                <span>${item.label}</span>
                <strong>${formatCompactNumber(item.count)} | ${formatPercent(item.count / totalCount * 100, 1)}</strong>
            </div>
        `).join("");
    };

    const render = () => {
        filterButtons.forEach((button) => {
            button.classList.toggle("is-active", button.dataset.eventFilter === state.filter);
        });

        const filtered = getFilteredData();
        const maxVisible = Math.max(1, filtered.length);
        state.limit = Math.max(1, Math.min(state.limit, maxVisible));
        limitInput.min = "1";
        limitInput.max = String(maxVisible);
        limitInput.value = String(state.limit);
        limitValue.textContent = String(state.limit);

        const displayed = filtered.slice(0, state.limit);
        if (!displayed.some((item) => item.action === state.activeAction)) {
            state.activeAction = displayed[0]?.action || "";
        }

        const activeItem = displayed.find((item) => item.action === state.activeAction) || displayed[0];
        const maxCount = Math.max(...displayed.map((item) => item.count), 1);
        const maxMetric = Math.log10(maxCount + 1);
        const barWidth = displayed.length >= 24 ? 58 : displayed.length >= 18 ? 62 : displayed.length >= 12 ? 68 : 76;

        chart.style.setProperty("--event-bar-width", `${barWidth}px`);

        chart.innerHTML = displayed.map((item) => {
            const metric = Math.log10(item.count + 1);
            const size = metric / maxMetric;
            const color = ACTION_TYPE_META[item.type].color;
            const isActive = item.action === state.activeAction;
            return `
                <button
                    class="event-bar${isActive ? " is-active" : ""}"
                    type="button"
                    data-event-action="${item.action}"
                    style="--bar-size:${size.toFixed(4)}; --bar-color:${color};">
                    <span class="event-bar-value">${formatCompactNumber(item.count)}</span>
                    <span class="event-bar-column" aria-hidden="true"></span>
                    <span class="event-bar-label">${item.action}</span>
                </button>
            `;
        }).join("");

        chart.querySelectorAll("[data-event-action]").forEach((button) => {
            const activate = () => {
                if ((button.dataset.eventAction || "") === state.activeAction) return;
                state.activeAction = button.dataset.eventAction || state.activeAction;
                render();
            };
            button.addEventListener("mouseenter", activate);
            button.addEventListener("focus", activate);
            button.addEventListener("click", activate);
        });

        if (activeItem) updateInspector(activeItem);
        renderTypeSummary();
    };

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            state.filter = button.dataset.eventFilter || "all";
            render();
        });
    });

    limitInput.addEventListener("input", () => {
        state.limit = Number(limitInput.value);
        render();
    });

    render();
}

function setupTrajectoryVisualizer() {
    const root = document.querySelector("[data-trajectory-visualizer]");
    if (!root) return;

    const pitch = root.querySelector("[data-trajectory-pitch]");
    const modeButtons = Array.from(root.querySelectorAll("[data-trajectory-mode]"));
    const zoneButtons = Array.from(root.querySelectorAll("[data-trajectory-zone]"));
    const activeName = root.querySelector("[data-trajectory-active-name]");
    const activeCopy = root.querySelector("[data-trajectory-active-copy]");
    const activeCount = root.querySelector("[data-trajectory-active-count]");
    const activeCenter = root.querySelector("[data-trajectory-active-center]");
    const activeThird = root.querySelector("[data-trajectory-active-third]");
    const activeLane = root.querySelector("[data-trajectory-active-lane]");
    if (!pitch || !activeName || !activeCopy || !activeCount || !activeCenter || !activeThird || !activeLane) return;

    const rows = TRAJECTORY_HEATMAP.length;
    const cols = TRAJECTORY_HEATMAP[0].length;
    const cellWidth = 105 / cols;
    const cellHeight = 68 / rows;

    const bins = TRAJECTORY_HEATMAP.flatMap((row, rowIndex) => row.map((count, colIndex) => ({
        id: `${rowIndex}-${colIndex}`,
        row: rowIndex,
        col: colIndex,
        count,
        x: colIndex * cellWidth,
        y: rowIndex * cellHeight,
        centerX: Number(((colIndex + 0.5) * cellWidth).toFixed(1)),
        centerY: Number(((rowIndex + 0.5) * cellHeight).toFixed(1))
    })));

    const maxCount = Math.max(...bins.map((bin) => bin.count));
    const state = {
        mode: "combined",
        zone: "all",
        activeBinId: "4-13"
    };

    const getThirdName = (col) => {
        if (col <= 4) return "Defending third";
        if (col <= 9) return "Middle third";
        return "Attacking third";
    };

    const getLaneName = (row) => {
        if (row <= 2) return "Lower lane";
        if (row <= 6) return "Central lane";
        return "Upper lane";
    };

    const getZoneMatcher = () => {
        if (state.zone === "defensive") return (bin) => bin.col <= 4;
        if (state.zone === "middle") return (bin) => bin.col >= 5 && bin.col <= 9;
        if (state.zone === "attacking") return (bin) => bin.col >= 10;
        return () => true;
    };

    const getBinTitle = (bin) => getThirdName(bin.col).replace(" third", "");

    const updateInspector = (bin) => {
        activeName.textContent = `${getBinTitle(bin)} hotspot`;
        activeCopy.textContent = `This precomputed cell concentrates ${formatCompactNumber(bin.count)} trajectory points.`;
        activeCount.textContent = formatFullNumber(bin.count);
        activeCenter.textContent = `(${bin.centerX.toFixed(1)}, ${bin.centerY.toFixed(1)})`;
        activeThird.textContent = getThirdName(bin.col);
        activeLane.textContent = getLaneName(bin.row);
    };

    const renderPitch = (visibleBins) => {
        const zoneMatcher = getZoneMatcher();
        const showDensity = state.mode === "combined" || state.mode === "density";
        const showSamples = state.mode === "combined" || state.mode === "samples";

        const pitchMarkup = `
            <rect x="0.5" y="0.5" width="104" height="67" rx="1.6" class="trajectory-pitch-base"></rect>
            <line x1="52.5" y1="0.5" x2="52.5" y2="67.5" class="trajectory-pitch-mark"></line>
            <circle cx="52.5" cy="34" r="9.15" class="trajectory-pitch-mark"></circle>
            <circle cx="52.5" cy="34" r="0.6" class="trajectory-pitch-mark"></circle>
            <rect x="0.5" y="13.9" width="16.5" height="40.2" class="trajectory-pitch-mark"></rect>
            <rect x="88" y="13.9" width="16.5" height="40.2" class="trajectory-pitch-mark"></rect>
            <rect x="0.5" y="24.9" width="5.5" height="18.2" class="trajectory-pitch-mark"></rect>
            <rect x="99" y="24.9" width="5.5" height="18.2" class="trajectory-pitch-mark"></rect>
        `;

        const cellsMarkup = bins.map((bin) => {
            const normalized = Math.max(0.08, bin.count / maxCount);
            const alpha = showDensity ? (0.12 + normalized * 0.72) : 0;
            const dimmed = !zoneMatcher(bin);
            const displayY = 68 - bin.y - cellHeight;
            return `
                <rect
                    class="trajectory-cell${bin.id === state.activeBinId ? " is-active" : ""}${dimmed ? " is-dimmed" : ""}"
                    data-trajectory-cell="${bin.id}"
                    x="${bin.x.toFixed(2)}"
                    y="${displayY.toFixed(2)}"
                    width="${cellWidth.toFixed(2)}"
                    height="${cellHeight.toFixed(2)}"
                    fill="rgba(37, 90, 140, ${alpha.toFixed(3)})"></rect>
            `;
        }).join("");

        const pointsMarkup = TRAJECTORY_SAMPLE_POINTS.map((point, index) => {
            const binLike = { col: Math.min(cols - 1, Math.floor(point.x / cellWidth)) };
            const inZone = zoneMatcher(binLike);
            const opacity = showSamples ? (inZone ? 0.92 : 0.18) : 0;
            return `
                <circle
                    class="trajectory-point${inZone ? " is-active-zone" : " is-dimmed"}"
                    cx="${point.x}"
                    cy="${(68 - point.y).toFixed(2)}"
                    r="${inZone ? 0.92 : 0.78}"
                    fill-opacity="${opacity.toFixed(2)}"
                    data-point-index="${index}">
                </circle>
            `;
        }).join("");

        pitch.innerHTML = `
            ${pitchMarkup}
            <g>${cellsMarkup}</g>
            <g>${pointsMarkup}</g>
        `;

        pitch.querySelectorAll("[data-trajectory-cell]").forEach((cell) => {
            const activate = () => {
                if ((cell.dataset.trajectoryCell || "") === state.activeBinId) return;
                state.activeBinId = cell.dataset.trajectoryCell || state.activeBinId;
                render();
            };
            cell.addEventListener("mouseenter", activate);
            cell.addEventListener("focus", activate);
            cell.addEventListener("click", activate);
        });
    };

    const render = () => {
        modeButtons.forEach((button) => {
            button.classList.toggle("is-active", button.dataset.trajectoryMode === state.mode);
        });
        zoneButtons.forEach((button) => {
            button.classList.toggle("is-active", button.dataset.trajectoryZone === state.zone);
        });

        const zoneMatcher = getZoneMatcher();
        const visibleBins = bins.filter(zoneMatcher);
        if (!visibleBins.some((bin) => bin.id === state.activeBinId)) {
            state.activeBinId = visibleBins.slice().sort((a, b) => b.count - a.count)[0]?.id || bins[0].id;
        }

        const activeBin = bins.find((bin) => bin.id === state.activeBinId) || visibleBins[0] || bins[0];
        renderPitch(visibleBins);
        updateInspector(activeBin);
    };

    modeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            state.mode = button.dataset.trajectoryMode || "combined";
            render();
        });
    });

    zoneButtons.forEach((button) => {
        button.addEventListener("click", () => {
            state.zone = button.dataset.trajectoryZone || "all";
            render();
        });
    });

    render();
}

function setupDatasetVisualizers() {
    setupEventVisualizer();
    setupTrajectoryVisualizer();
}

window.addEventListener("scroll", updateScrollButton, { passive: true });

document.addEventListener("DOMContentLoaded", () => {
    ensureDefaultOverviewHash();
    updateScrollButton();
    setupReveals();
    setupActiveNav();
    setupDeferredVideos();
    setupRealismQuiz();
    setupRealismOverviewModal();
    setupUtilityQuiz();
    setupUtilityOverviewModal();
    setupDatasetVisualizers();
});

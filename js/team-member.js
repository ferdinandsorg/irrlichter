/** Über page: animated expand/collapse for .team-member__details (page-ueber only). */
(function () {
  "use strict";

  var DURATION_MS = 280;
  var EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

  function clearAnimatedStyles(details, body) {
    details.style.height = "";
    details.style.overflow = "";
    details.style.transition = "";
    body.style.opacity = "";
    body.style.transition = "";
  }

  function initTeamMemberDetails() {
    if (!document.body.classList.contains("page-ueber")) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    var detailsList = document.querySelectorAll(".team-member__details");

    detailsList.forEach(function (details) {
      var summary = details.querySelector(".team-member__summary");
      var body = details.querySelector(".team-member__body");
      if (!summary || !body) {
        return;
      }

      summary.addEventListener("click", function (e) {
        var isOpen = details.open;
        var closedHeight = summary.offsetHeight;
        var startHeight = details.offsetHeight;
        var endHeight;

        if (details.dataset.teamAnimating === "1") {
          e.preventDefault();
          return;
        }

        e.preventDefault();
        details.dataset.teamAnimating = "1";
        details.style.overflow = "hidden";
        details.style.height = startHeight + "px";

        if (isOpen) {
          endHeight = closedHeight;
          body.style.opacity = "1";
          body.style.transition = "opacity " + DURATION_MS / 1000 + "s " + EASING;
          details.style.transition = "height " + DURATION_MS / 1000 + "s " + EASING;

          window.requestAnimationFrame(function () {
            body.style.opacity = "0";
            details.style.height = endHeight + "px";
          });

          window.setTimeout(function () {
            details.open = false;
            clearAnimatedStyles(details, body);
            delete details.dataset.teamAnimating;
          }, DURATION_MS);
          return;
        }

        details.open = true;
        endHeight = details.scrollHeight;
        body.style.opacity = "0";
        body.style.transition = "opacity " + DURATION_MS / 1000 + "s " + EASING;
        details.style.transition = "height " + DURATION_MS / 1000 + "s " + EASING;

        window.requestAnimationFrame(function () {
          details.style.height = endHeight + "px";
          body.style.opacity = "1";
        });

        window.setTimeout(function () {
          clearAnimatedStyles(details, body);
          delete details.dataset.teamAnimating;
        }, DURATION_MS);
      });
    });
  }

  function initTeamPhotoLightbox() {
    if (!document.body.classList.contains("page-ueber")) {
      return;
    }
    if (!window.irrMediaLightbox) {
      return;
    }
    window.irrMediaLightbox.init();

    document
      .querySelectorAll(".team-member__media:not(.team-member__media--fallback)")
      .forEach(function (media) {
        var img = media.querySelector(".team-member__photo");
        if (!img || !img.getAttribute("src")) {
          return;
        }

        var nameEl = media.closest(".team-member");
        nameEl = nameEl && nameEl.querySelector(".team-member__name");
        var name = (nameEl && nameEl.textContent.trim()) || "Teamfoto";
        if (!img.getAttribute("alt") || !img.getAttribute("alt").trim()) {
          img.setAttribute("alt", "Porträt von " + name);
        }

        media.setAttribute("role", "button");
        media.setAttribute("tabindex", "0");
        media.setAttribute("aria-label", name + " vergrößern");

        function openPhoto(e) {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          window.irrMediaLightbox.open({
            kind: "image",
            src: img.currentSrc || img.src,
            alt: img.getAttribute("alt") || ""
          });
        }

        media.addEventListener("click", openPhoto);
        media.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            openPhoto(e);
          }
        });
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTeamMemberDetails();
    initTeamPhotoLightbox();
  });
})();

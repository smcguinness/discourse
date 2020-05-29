import { createWidget, applyDecorators } from "discourse/widgets/widget";
import { h } from "virtual-dom";

createWidget("admin-menu-button", {
  tagName: "li",

  buildClasses(attrs) {
    return attrs.className;
  },

  html(attrs) {
    let className;
    if (attrs.buttonClass) {
      className = attrs.buttonClass;
    }

    return this.attach("button", {
      className,
      action: attrs.action,
      url: attrs.url,
      icon: attrs.icon,
      label: attrs.fullLabel || `topic.${attrs.label}`,
      secondaryAction: "hideAdminMenu"
    });
  }
});

createWidget("topic-admin-menu-button", {
  tagName: "span",
  buildKey: () => "topic-admin-menu-button",

  defaultState() {
    return { expanded: false, position: null };
  },

  html(attrs, state) {
    const result = [];

    const menu = this.attach("topic-admin-menu", {
      position: state.position,
      fixed: attrs.fixed,
      topic: attrs.topic,
      openUpwards: attrs.openUpwards,
      rightSide: !this.site.mobileView && attrs.rightSide,
      actionButtons: []
    });

    // We don't show the button when expanded on the right side on desktop
    if (
      menu.attrs.actionButtons.length &&
      (!(attrs.rightSide && state.expanded) || this.site.mobileView)
    ) {
      result.push(
        this.attach("button", {
          className:
            "popup-menu-button toggle-admin-menu" +
            (attrs.fixed ? " show-topic-admin" : "") +
            (attrs.addKeyboardTargetClass ? " keyboard-target-admin-menu" : ""),
          title: "topic_admin_menu",
          icon: "wrench",
          action: "showAdminMenu",
          sendActionEvent: true
        })
      );
    }

    if (state.expanded) {
      result.push(menu);
    }

    return result;
  },

  hideAdminMenu() {
    this.state.expanded = false;
    this.state.position = null;

    if (this.site.mobileView && !this.attrs.rightSide) {
      $(".header-cloak").css("display", "");
    }
  },

  showAdminMenu(e) {
    this.state.expanded = true;
    let $button;

    if (e === undefined) {
      $button = $(".keyboard-target-admin-menu");
    } else {
      $button = $(e.target).closest("button");
    }

    const position = $button.position();

    const rtl = $("html").hasClass("rtl");
    position.outerHeight = $button.outerHeight();

    if (rtl) {
      position.left -= 217 - $button.outerWidth();
    }

    if (this.attrs.fixed) {
      position.left += $button.width() - 203;
    }

    if (this.site.mobileView && !this.attrs.rightSide) {
      const headerCloak = document.querySelector(".header-cloak");
      if (headerCloak) headerCloak.style.display = "block";
    }

    this.state.position = position;
  },

  topicToggleActions() {
    this.state.expanded ? this.hideAdminMenu() : this.showAdminMenu();
  }
});

export default createWidget("topic-admin-menu", {
  tagName: "div.popup-menu.topic-admin-popup-menu",

  buildClasses(attrs) {
    if (attrs.rightSide) {
      return "right-side";
    }
  },

  init(attrs) {
    const topic = attrs.topic;
    const details = topic.get("details");
    const isPrivateMessage = topic.get("isPrivateMessage");
    const featured = topic.get("pinned_at") || topic.get("isBanner");
    const visible = topic.get("visible");

    // Admin actions
    if (this.currentUser && this.currentUser.get("canManageTopic")) {
      this.addActionButton({
        className: "topic-admin-multi-select",
        buttonClass: "popup-menu-btn",
        action: "toggleMultiSelect",
        icon: "tasks",
        label: "actions.multi_select"
      });

      if (details.get("can_delete")) {
        this.addActionButton({
          className: "topic-admin-delete",
          buttonClass: "popup-menu-btn-danger",
          action: "deleteTopic",
          icon: "far-trash-alt",
          label: "actions.delete"
        });
      }

      if (topic.get("deleted") && details.get("can_recover")) {
        this.addActionButton({
          className: "topic-admin-recover",
          buttonClass: "popup-menu-btn",
          action: "recoverTopic",
          icon: "undo",
          label: "actions.recover"
        });
      }

      if (topic.get("closed")) {
        this.addActionButton({
          className: "topic-admin-open",
          buttonClass: "popup-menu-btn",
          action: "toggleClosed",
          icon: "unlock",
          label: "actions.open"
        });
      } else {
        this.addActionButton({
          className: "topic-admin-close",
          buttonClass: "popup-menu-btn",
          action: "toggleClosed",
          icon: "lock",
          label: "actions.close"
        });
      }

      this.addActionButton({
        className: "topic-admin-status-update",
        buttonClass: "popup-menu-btn",
        action: "showTopicStatusUpdate",
        icon: "far-clock",
        label: "actions.timed_update"
      });

      if (!isPrivateMessage && (topic.get("visible") || featured)) {
        this.addActionButton({
          className: "topic-admin-pin",
          buttonClass: "popup-menu-btn",
          action: "showFeatureTopic",
          icon: "thumbtack",
          label: featured ? "actions.unpin" : "actions.pin"
        });
      }

      if (this.currentUser.get("staff")) {
        this.addActionButton({
          className: "topic-admin-change-timestamp",
          buttonClass: "popup-menu-btn",
          action: "showChangeTimestamp",
          icon: "calendar-alt",
          label: "change_timestamp.title"
        });
      }

      this.addActionButton({
        className: "topic-admin-reset-bump-date",
        buttonClass: "popup-menu-btn",
        action: "resetBumpDate",
        icon: "anchor",
        label: "actions.reset_bump_date"
      });

      if (!isPrivateMessage) {
        this.addActionButton({
          className: "topic-admin-archive",
          buttonClass: "popup-menu-btn",
          action: "toggleArchived",
          icon: "folder",
          label: topic.get("archived") ? "actions.unarchive" : "actions.archive"
        });
      }

      this.addActionButton({
        className: "topic-admin-visible",
        buttonClass: "popup-menu-btn",
        action: "toggleVisibility",
        icon: visible ? "far-eye-slash" : "far-eye",
        label: visible ? "actions.invisible" : "actions.visible"
      });

      if (details.get("can_convert_topic")) {
        this.addActionButton({
          className: "topic-admin-convert",
          buttonClass: "popup-menu-btn",
          action: isPrivateMessage
            ? "convertToPublicTopic"
            : "convertToPrivateMessage",
          icon: isPrivateMessage ? "comment" : "envelope",
          label: isPrivateMessage
            ? "actions.make_public"
            : "actions.make_private"
        });
      }

      if (this.currentUser.get("staff")) {
        this.addActionButton({
          icon: "list",
          buttonClass: "popup-menu-btn",
          fullLabel: "review.moderation_history",
          url: `/review?topic_id=${topic.id}&status=all`
        });
      }
    }
  },

  buildAttributes(attrs) {
    let { top, left, outerHeight } = attrs.position;
    const position = attrs.fixed || this.site.mobileView ? "fixed" : "absolute";

    if (attrs.rightSide) {
      return;
    }

    if (attrs.openUpwards) {
      const documentHeight = $(document).height();
      const mainHeight = $("#main").height();
      let bottom = documentHeight - top - 70 - $("#main").offset().top;

      if (documentHeight > mainHeight) {
        bottom = bottom - (documentHeight - mainHeight) - outerHeight;
      }

      if (this.site.mobileView) {
        bottom = 0;
        left = 0;
      }

      return {
        style: `position: ${position}; bottom: ${bottom}px; left: ${left}px;`
      };
    } else {
      return {
        style: `position: ${position}; top: ${top}px; left: ${left}px;`
      };
    }
  },

  addActionButton(button) {
    this.attrs.actionButtons.push(button);
  },

  html(attrs) {
    const extraButtons = applyDecorators(
      this,
      "adminMenuButtons",
      this.attrs,
      this.state
    );
    return h(
      "ul",
      attrs.actionButtons
        .concat(extraButtons)
        .filter(Boolean)
        .map(b => this.attach("admin-menu-button", b))
    );
  },

  clickOutside() {
    this.sendWidgetAction("hideAdminMenu");
  }
});
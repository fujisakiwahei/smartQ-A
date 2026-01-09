import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import LauncherButton from "../../../app/components/widget/LauncherButton.vue";

describe("LauncherButton", () => {
  it("emits toggle event on click", async () => {
    const wrapper = mount(LauncherButton, {
      global: {
        stubs: { Icon: true }, // Mock the Nuxt Icon component
      },
    });

    await wrapper.find("button").trigger("click");
    expect(wrapper.emitted()).toHaveProperty("toggle");
  });
});

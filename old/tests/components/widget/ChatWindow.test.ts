import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ChatWindow from "../../../app/components/widget/ChatWindow.vue";

describe("ChatWindow", () => {
  it("renders messages correctly", () => {
    const messages = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there" },
    ];
    const wrapper = mount(ChatWindow, {
      props: { messages, isLoading: false },
      global: { stubs: { Icon: true } },
    });

    expect(wrapper.text()).toContain("Hello");
    expect(wrapper.text()).toContain("Hi there");
  });

  it("emits send event with input value", async () => {
    const wrapper = mount(ChatWindow, {
      props: { messages: [], isLoading: false },
      global: { stubs: { Icon: true } },
    });

    const input = wrapper.find("input");
    await input.setValue("My question");
    await wrapper.find("form").trigger("submit");

    expect(wrapper.emitted("send")![0]).toEqual(["My question"]);
  });

  it("disables input while loading", async () => {
    const wrapper = mount(ChatWindow, {
      props: { messages: [], isLoading: true },
      global: { stubs: { Icon: true } },
    });

    const input = wrapper.find("input");
    expect(input.element.disabled).toBe(true);
  });
});

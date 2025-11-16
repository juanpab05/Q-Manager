import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import Navbar from "./navbar";
import * as Utils from "./NavbarUtils";
import { BrowserRouter } from "react-router-dom";
import React from "react";

// Mock AuthContext
jest.mock("../../contexts/auth/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    logout: jest.fn(),
  }),
}));

let container: HTMLDivElement;
let root: any;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  root.unmount();
  document.body.removeChild(container);
});

const render = (element: React.ReactElement) => {
  act(() => {
    root.render(<BrowserRouter>{element}</BrowserRouter>);
  });
};

describe("Navbar (createRoot version)", () => {
  
  test("renders desktop navbar when isMobile = false", () => {
    jest.spyOn(Utils, "useMediaQuery").mockReturnValue(false);

    render(<Navbar />);

    expect(container.textContent).toContain("Inicio");
    expect(container.textContent).toContain("Dashboard");
  });

  test("renders mobile button when isMobile = true", () => {
    jest.spyOn(Utils, "useMediaQuery").mockReturnValue(true);

    render(<Navbar />);

    const btn = container.querySelector("button");
    expect(btn).not.toBeNull();
  });

  test("opens mobile menu when clicking", () => {
    jest.spyOn(Utils, "useMediaQuery").mockReturnValue(true);

    render(<Navbar />);

    const btn = container.querySelector("button");
    expect(btn).not.toBeNull();

    act(() => {
      btn!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Inicio");
  });


});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Applications from "./Applications";

// Mock child components if needed
vi.mock("./SingleApplication", () => ({
  default: function MockSingleApplication({ application }) {
    return (
      <div data-testid="single-application">
        {application?.id} - {application?.name}
      </div>
    );
  },
}));

vi.mock("./ui/Button/Button", () => ({
  Button: ({ children, onClick, disabled, className }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-testid="load-more-button"
    >
      {children}
    </button>
  ),
}));

describe("Applications Component", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.resetAllMocks();
  });

  afterEach(() => {
    // Restore any mocked global.fetch
    vi.restoreAllMocks();
  });

  it("renders without crashing and fetches initial data on mount", async () => {
    // Mock successful fetch
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, name: "First Application" },
        { id: 2, name: "Second Application" },
      ],
    });

    render(<Applications />);

    // Ensure fetch is called on mount
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/api/applications?_page=1&_limit=5"
    );

    // Wait for items to appear
    await waitFor(() => {
      const items = screen.getAllByTestId("single-application");
      expect(items).toHaveLength(2);
    });

    // Check that the "Load More" button is in the document
    expect(screen.getByTestId("load-more-button")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  it("loads more data when 'Load More' is clicked", async () => {
    // First fetch (on mount)
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, name: "First Application" },
          { id: 2, name: "Second Application" },
        ],
      })
      // Second fetch (on button click)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 3, name: "Third Application" },
          { id: 4, name: "Fourth Application" },
        ],
      });

    render(<Applications />);

    // First fetch call
    await waitFor(() => {
      expect(screen.getAllByTestId("single-application")).toHaveLength(2);
    });

    // Click "Load More" button
    const loadMoreBtn = screen.getByTestId("load-more-button");
    await userEvent.click(loadMoreBtn);

    // Second fetch call
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenLastCalledWith(
      "http://localhost:3001/api/applications?_page=2&_limit=5"
    );

    // Wait for newly fetched items
    await waitFor(() => {
      const items = screen.getAllByTestId("single-application");
      // Should now have 4 items
      expect(items).toHaveLength(4);
    });
  });

  it("displays an error message if fetch fails", async () => {
    // Mock a failing fetch
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => [],
    });

    render(<Applications />);

    // Wait for error to appear
    await waitFor(() => {
      expect(
        screen.getByText("Error fetching applications. Please try again later.")
      ).toBeInTheDocument();
    });
  });

  it("disables the 'Load More' button and shows 'Loading...' when loading", async () => {
    // Create a promise that we won't resolve right away
    let mockPromiseResolve;
    const mockPromise = new Promise((resolve) => {
      mockPromiseResolve = resolve;
    });

    global.fetch = vi.fn().mockImplementation(() => {
      return {
        ok: true,
        json: () => mockPromise,
      };
    });

    render(<Applications />);

    // Button should be in "Loading..." state while fetch is in flight
    const loadMoreBtn = screen.getByTestId("load-more-button");
    expect(loadMoreBtn).toBeDisabled();
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Now resolve the promise
    mockPromiseResolve([{ id: 1, name: "First Application" }]);

    // Wait for the data to be rendered
    await waitFor(() => {
      expect(screen.getAllByTestId("single-application")).toHaveLength(1);
    });

    // Now the button is re-enabled
    expect(loadMoreBtn).not.toBeDisabled();
    expect(screen.getByText("Load More")).toBeInTheDocument();
  });

  it("does not render 'Load More' if hasMore is false (empty response)", async () => {
    // Simulate an empty response from the API so hasMore becomes false
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<Applications />);

    // Wait for data to finish loading
    await waitFor(() => {
      expect(screen.queryByTestId("load-more-button")).not.toBeInTheDocument();
    });
  });
});

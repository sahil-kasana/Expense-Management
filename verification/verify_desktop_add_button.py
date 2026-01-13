
from playwright.sync_api import sync_playwright, expect

def test_add_expense_button(page):
    # Set mock user in localStorage to bypass login
    page.goto("http://localhost:8080/index.html")
    page.evaluate("""
        localStorage.setItem('myBuddyToken', 'mock-token');
        localStorage.setItem('myBuddyUser', JSON.stringify({name: 'Test User', email: 'test@example.com'}));
        location.reload();
    """)

    # Wait for dashboard to load
    page.wait_for_selector("#view-dashboard")

    # Set viewport to desktop
    page.set_viewport_size({"width": 1280, "height": 720})

    # Verify Add Expense button is visible
    add_btn = page.locator("#addExpenseBtnDesktop")
    expect(add_btn).to_be_visible()

    # Take screenshot of dashboard with button
    page.screenshot(path="/home/jules/verification/dashboard_with_button.png")

    # Click button and verify modal
    add_btn.click()
    expect(page.locator("#expenseModal")).to_be_visible()
    expect(page.locator("#modalTitle")).to_have_text("New Transaction")

    # Take screenshot of modal
    page.screenshot(path="/home/jules/verification/add_modal.png")

    print("Verification successful")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_add_expense_button(page)
        finally:
            browser.close()

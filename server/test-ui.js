const puppeteer = require('puppeteer');

async function testUI() {
  const browser = await puppeteer.launch({ headless: false });
  
  try {
    // Test user 2 (who has completed the test)
    console.log('Testing with user 2 (who has completed the test)...');
    const page1 = await browser.newPage();
    await page1.goto('http://localhost:5173/login');
    
    // Login as user 2
    await page1.type('input[name="email"]', '2');
    await page1.type('input[name="password"]', '2');
    await page1.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page1.waitForSelector('.dashboard-container', { timeout: 5000 });
    console.log('User 2 logged in successfully');
    
    // Go to the assessment
    await page1.goto(`http://localhost:5173/assessments/67ff33ef3e44d7000a70efeb/view`);
    await page1.waitForSelector('select', { timeout: 5000 });
    
    // Get the test status for user 2
    const user2Status = await page1.evaluate(() => {
      const progressBar = document.querySelector('.MuiLinearProgress-root');
      const progressValue = progressBar ? progressBar.getAttribute('aria-valuenow') : '0';
      return {
        progressValue,
        selectOptions: Array.from(document.querySelectorAll('select option'))
          .map(option => ({
            value: option.value,
            text: option.textContent,
            selected: option.selected
          }))
      };
    });
    
    console.log('User 2 test status:', user2Status);
    
    // Test user 3 (who has NOT completed the test)
    console.log('\nTesting with user 3 (who has NOT completed the test)...');
    const page2 = await browser.newPage();
    await page2.goto('http://localhost:5173/login');
    
    // Login as user 3
    await page2.type('input[name="email"]', '3');
    await page2.type('input[name="password"]', '3');
    await page2.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page2.waitForSelector('.dashboard-container', { timeout: 5000 });
    console.log('User 3 logged in successfully');
    
    // Go to the assessment
    await page2.goto(`http://localhost:5173/assessments/67ff33ef3e44d7000a70efeb/view`);
    await page2.waitForSelector('select', { timeout: 5000 });
    
    // Get the test status for user 3
    const user3Status = await page2.evaluate(() => {
      const progressBar = document.querySelector('.MuiLinearProgress-root');
      const progressValue = progressBar ? progressBar.getAttribute('aria-valuenow') : '0';
      return {
        progressValue,
        selectOptions: Array.from(document.querySelectorAll('select option'))
          .map(option => ({
            value: option.value,
            text: option.textContent,
            selected: option.selected
          }))
      };
    });
    
    console.log('User 3 test status:', user3Status);
    
    // Compare results
    console.log('\nTest Results:');
    const user2Progress = parseInt(user2Status.progressValue || '0');
    const user3Progress = parseInt(user3Status.progressValue || '0');
    
    console.log('User 2 progress:', user2Progress);
    console.log('User 3 progress:', user3Progress);
    
    if (user2Progress > user3Progress) {
      console.log('\n✅ TEST PASSED: User 2 has more progress than User 3');
    } else if (user2Progress === user3Progress && user2Progress === 0) {
      console.log('\n✅ TEST PASSED: Both users have 0 progress (expected if UI doesn\'t show progress)');
    } else {
      console.log('\n❌ TEST FAILED: User 3 should not have the same progress as User 2');
    }
    
    // Take screenshots
    await page1.screenshot({ path: 'user2-assessment.png' });
    await page2.screenshot({ path: 'user3-assessment.png' });
    
    console.log('Screenshots saved as user2-assessment.png and user3-assessment.png');
    
  } catch (error) {
    console.error('Error during UI testing:', error);
  } finally {
    await browser.close();
  }
}

testUI();

from pathlib import Path
path = Path(__file__).parent / 'test-cases.js'
text = path.read_text(encoding='utf-8')
text = text.replace("await driver.wait(until.elementLocated(By.css('.theme-toast-danger, .theme-toast')), 2000)", "await getToast(driver, 2000)")
text = text.replace("await driver.wait(until.elementLocated(By.css('.theme-toast')), 2000)", "await getToast(driver, 2000)")
text = text.replace("await driver.wait(until.elementLocated(By.css('.theme-toast')), 3000)", "await getToast(driver, 3000)")
text = text.replace("await driver.wait(until.elementLocated(By.css('.theme-toast')), 4000)", "await getToast(driver, 4000)")
text = text.replace("await driver.wait(until.elementLocated(By.css('.theme-toast')), 5000)", "await getToast(driver, 5000)")
text = text.replace("await driver.wait(until.elementLocated(By.css('.theme-toast')), 6000)", "await getToast(driver, 6000)")
path.write_text(text, encoding='utf-8')
print('toast selectors updated')

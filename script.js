document.addEventListener('DOMContentLoaded', function() {
    const gridContainer = document.getElementById('grid-container');
    const updateButton = document.getElementById('updateButton');
    const birthdateInput = document.getElementById('birthdate');
    const copyLinkButton = document.getElementById('copyLinkButton');
    const infoElement = document.getElementById('info');
    
    // Some years have 52 weeks + 1 or 2 days, which makes a 53rd partial week
    const YEARS_TO_DISPLAY = 100;
    
    // Check if there's a birthdate in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const birthdateFromUrl = urlParams.get('birthdate');
    
    if (birthdateFromUrl) {
        birthdateInput.value = birthdateFromUrl;
        generateLifeChart(birthdateFromUrl);
    }
    
    // Initialize the grid if no birthdate is provided
    if (!birthdateFromUrl) {
        createEmptyGrid();
    }
    
    // Handle the update button click
    updateButton.addEventListener('click', function() {
        const birthdate = birthdateInput.value;
        if (birthdate) {
            // Update the URL with the new birthdate
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('birthdate', birthdate);
            window.history.pushState({}, '', newUrl);
            
            generateLifeChart(birthdate);
        } else {
            alert('Please enter a valid birthdate.');
        }
    });
    
    // Handle the copy link button
    copyLinkButton.addEventListener('click', function() {
        const birthdate = birthdateInput.value;
        if (birthdate) {
            const url = new URL(window.location.href);
            url.searchParams.set('birthdate', birthdate);
            
            navigator.clipboard.writeText(url.href)
                .then(() => alert('Link copied to clipboard!'))
                .catch(err => console.error('Failed to copy link: ', err));
        } else {
            alert('Please enter a birthdate first.');
        }
    });
    
    function createEmptyGrid() {
        gridContainer.innerHTML = '';
        
        // Create 100 rows (years)
        for (let year = 0; year < YEARS_TO_DISPLAY; year++) {
            const rowElement = document.createElement('div');
            rowElement.className = 'row';
            rowElement.setAttribute('data-year', year);
            
            // Standard weeks per row - we'll adjust this based on birthdate later
            const weeksPerRow = 53; // Allow for 53 weeks to accommodate leap years
            
            for (let week = 0; week < weeksPerRow; week++) {
                const boxElement = document.createElement('div');
                boxElement.className = 'box';
                boxElement.setAttribute('data-week', week);
                rowElement.appendChild(boxElement);
            }
            
            gridContainer.appendChild(rowElement);
        }
    }
    
    // Helper function to calculate age (year of life, 0-indexed)
    function calculateAge(checkDate, birthD) {
        let age = checkDate.getFullYear() - birthD.getFullYear();
        const m = checkDate.getMonth() - birthD.getMonth();
        if (m < 0 || (m === 0 && checkDate.getDate() < birthD.getDate())) {
            age--;
        }
        return age;
    }

    function generateLifeChart(birthdate) {
        gridContainer.innerHTML = ''; // Clear the grid

        const birthDate = new Date(birthdate);
        birthDate.setHours(0, 0, 0, 0);

        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        if (isNaN(birthDate.getTime()) || birthDate > currentDate) {
            infoElement.textContent = "Please enter a valid past birthdate.";
            return;
        }

        const millisecondsInWeek = 7 * 24 * 60 * 60 * 1000;

        // Pre-calculate Sundays of the week of the Nth birthday
        const yearStartSundays = [];
        for (let i = 0; i <= YEARS_TO_DISPLAY; i++) { // Iterate up to YEARS_TO_DISPLAY for the end of the last year
            const NthBirthday = new Date(birthDate);
            NthBirthday.setFullYear(birthDate.getFullYear() + i);
            const sundayOfWeekOfNthBirthday = new Date(NthBirthday);
            sundayOfWeekOfNthBirthday.setDate(NthBirthday.getDate() - NthBirthday.getDay()); // Get Sunday
            sundayOfWeekOfNthBirthday.setHours(0,0,0,0);
            yearStartSundays.push(sundayOfWeekOfNthBirthday);
        }

        // Create the grid structure dynamically using yearStartSundays
        for (let yearIdx = 0; yearIdx < YEARS_TO_DISPLAY; yearIdx++) {
            const rowElement = document.createElement('div');
            rowElement.className = 'row';
            rowElement.setAttribute('data-year', yearIdx);

            // Calculate weeks in this year of life based on the interval between yearStartSundays
            let weeksInThisYearOfLife = Math.round((yearStartSundays[yearIdx+1] - yearStartSundays[yearIdx]) / millisecondsInWeek);
            
            if (weeksInThisYearOfLife <= 0) weeksInThisYearOfLife = 52; // Fallback
            if (weeksInThisYearOfLife > 53) weeksInThisYearOfLife = 53; // Cap

            for (let weekIdx = 0; weekIdx < weeksInThisYearOfLife; weekIdx++) {
                const boxElement = document.createElement('div');
                boxElement.className = 'box';
                boxElement.setAttribute('data-week', weekIdx);
                rowElement.appendChild(boxElement);
            }
            gridContainer.appendChild(rowElement);
        }
        
        const weeksArray = []; 
        if (yearStartSundays.length > 0 && yearStartSundays[0] < yearStartSundays[YEARS_TO_DISPLAY]) {
            let iterDateLived = new Date(yearStartSundays[0]); // Start from Sunday of birth week

            while (iterDateLived <= currentDate && iterDateLived < yearStartSundays[YEARS_TO_DISPLAY]) {
                let currentYearOfLife = -1;
                // Determine currentYearOfLife based on iterDateLived and yearStartSundays
                for (let y = 0; y < YEARS_TO_DISPLAY; y++) {
                    if (yearStartSundays[y+1] && iterDateLived >= yearStartSundays[y] && iterDateLived < yearStartSundays[y+1]) {
                        currentYearOfLife = y;
                        break;
                    }
                }

                if (currentYearOfLife !== -1) {
                    const startOfWeekForThisYearOfLife = yearStartSundays[currentYearOfLife];
                    const weekOfYear = Math.floor((iterDateLived.getTime() - startOfWeekForThisYearOfLife.getTime()) / millisecondsInWeek);

                    const endOfWeek = new Date(iterDateLived);
                    endOfWeek.setDate(iterDateLived.getDate() + 6); // Saturday of this week

                    // Add if this week is actually part of life (i.e., person was born by the end of this week)
                    // and the weekOfYear is valid for the row.
                    if (endOfWeek >= birthDate && weekOfYear >= 0) {
                        weeksArray.push({
                            date: new Date(iterDateLived),
                            yearOfLife: currentYearOfLife,
                            weekOfYear: weekOfYear
                        });
                    }
                }
                iterDateLived.setDate(iterDateLived.getDate() + 7);
            }
        }
        
        const upcomingWeeksArray = [];
        // Calculate next birthday
        let nextBirthdayYearCalc = currentDate.getFullYear();
        if (currentDate.getMonth() > birthDate.getMonth() || 
            (currentDate.getMonth() === birthDate.getMonth() && currentDate.getDate() >= birthDate.getDate())) {
            nextBirthdayYearCalc++;
        }
        const nextBirthday = new Date(nextBirthdayYearCalc, birthDate.getMonth(), birthDate.getDate());
        
        // Calculate upcoming weeks until next birthday
        let iterDateUpcoming = new Date(currentDate);
        if (iterDateUpcoming.getDay() !== 0) {
             iterDateUpcoming.setDate(iterDateUpcoming.getDate() + (7 - iterDateUpcoming.getDay()));
        } else {
            const lastLivedWeek = weeksArray.length > 0 ? weeksArray[weeksArray.length-1] : null;
            if (lastLivedWeek && lastLivedWeek.date.getTime() === iterDateUpcoming.getTime()){
                iterDateUpcoming.setDate(iterDateUpcoming.getDate() + 7); // Start from next week if current Sunday already counted
            }
        }

        while (iterDateUpcoming < nextBirthday && iterDateUpcoming >= currentDate) {
            const age = calculateAge(iterDateUpcoming, birthDate);
            if (age >= 0) {
                const NthBirthday = new Date(birthDate);
                NthBirthday.setFullYear(birthDate.getFullYear() + age);
                const startOfWeekOfNthBirthday = new Date(NthBirthday);
                startOfWeekOfNthBirthday.setDate(NthBirthday.getDate() - NthBirthday.getDay());
                const weekOfYear = Math.floor((iterDateUpcoming - startOfWeekOfNthBirthday) / millisecondsInWeek);
                
                if (weekOfYear >= 0 && age < YEARS_TO_DISPLAY) { // Ensure age is within grid bounds
                    upcomingWeeksArray.push({
                        date: new Date(iterDateUpcoming),
                        yearOfLife: age,
                        weekOfYear: weekOfYear
                    });
                }
            }
            iterDateUpcoming.setDate(iterDateUpcoming.getDate() + 7);
        }
        
        const weeksLivedCount = weeksArray.length;
        const actualYearsLived = weeksArray.length > 0 ? Math.max(0, ...weeksArray.map(w => w.yearOfLife)) : 0;
        const weeksInCurrentYearLived = weeksArray.length > 0 ? weeksArray.filter(w => w.yearOfLife === actualYearsLived).length : 0;
        const weeksUntilBirthdayCount = upcomingWeeksArray.length;
        
        const formattedBirthDate = birthDate.toLocaleDateString();
        const formattedCurrentDate = currentDate.toLocaleDateString();
        const formattedNextBirthday = nextBirthday.toLocaleDateString();
        
        if (weeksLivedCount > 0) {
            infoElement.textContent = `From ${formattedBirthDate} to ${formattedCurrentDate}, you have lived ${actualYearsLived} years and ${weeksInCurrentYearLived} weeks (${weeksLivedCount} weeks total). ${weeksUntilBirthdayCount} weeks until your next birthday on ${formattedNextBirthday}.`;
        } else if (birthDate <= currentDate) { // Born today or in the past, but no full weeks lived yet by this logic
             infoElement.textContent = `Born on ${formattedBirthDate}. Chart shows weeks starting from the Sunday of your birth week. ${weeksUntilBirthdayCount} weeks until your next birthday on ${formattedNextBirthday}.`;
        } else { // Should be caught by the initial check, but as a fallback
            infoElement.textContent = "Chart is for past birthdates.";
        }
        
        const rows = gridContainer.querySelectorAll('.row'); // Get the newly created rows
        
        weeksArray.forEach(week => {
            if (typeof week.yearOfLife === 'number' && week.yearOfLife >= 0 && week.yearOfLife < rows.length) {
                const rowElement = rows[week.yearOfLife];
                if (rowElement && typeof week.weekOfYear === 'number' && week.weekOfYear >= 0) {
                    const boxes = rowElement.querySelectorAll('.box');
                    if (week.weekOfYear < boxes.length) {
                        boxes[week.weekOfYear].classList.add('filled');
                    }
                }
            }
        });
        
        upcomingWeeksArray.forEach(week => {
            if (typeof week.yearOfLife === 'number' && week.yearOfLife >= 0 && week.yearOfLife < rows.length) {
                const rowElement = rows[week.yearOfLife];
                if (rowElement && typeof week.weekOfYear === 'number' && week.weekOfYear >= 0) {
                    const boxes = rowElement.querySelectorAll('.box');
                    if (week.weekOfYear < boxes.length) {
                        boxes[week.weekOfYear].classList.add('upcoming-birthday');
                    }
                }
            }
        });
        
        const allYearsInvolved = [...new Set([...weeksArray, ...upcomingWeeksArray].map(w => w.yearOfLife))];
        const maxYearToLabel = allYearsInvolved.length > 0 ? Math.max(...allYearsInvolved) : -1;

        rows.forEach((row, index) => {
            const existingLabel = row.querySelector('.year-label');
            if (existingLabel) {
                row.removeChild(existingLabel);
            }
            if (index <= maxYearToLabel && index < YEARS_TO_DISPLAY) {
                const yearLabel = document.createElement('div');
                yearLabel.className = 'year-label';
                yearLabel.textContent = index + 1; 
                row.insertBefore(yearLabel, row.firstChild);
            }
        });
    }
});

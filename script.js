document.addEventListener('DOMContentLoaded', function() {
    const gridContainer = document.getElementById('grid-container');
    const updateButton = document.getElementById('updateButton');
    const birthdateInput = document.getElementById('birthdate');
    const endYearInput = document.getElementById('endYear');
    const copyLinkButton = document.getElementById('copyLinkButton');
    const infoElement = document.getElementById('info');

    // Default years to display if not specified
    const DEFAULT_YEARS = 100;
    
    const urlParams = new URLSearchParams(window.location.search);
    const birthdateFromUrl = urlParams.get('birthdate');
    const endYearFromUrl = urlParams.get('endYear');

    // Set input values from URL if available
    if (birthdateFromUrl) {
        birthdateInput.value = birthdateFromUrl;
    }
    
    if (endYearFromUrl) {
        const parsedEndYear = parseInt(endYearFromUrl);
        if (!isNaN(parsedEndYear) && parsedEndYear > 0 && parsedEndYear <= 120) {
            endYearInput.value = parsedEndYear;
        }
    }
    
    if (birthdateFromUrl) {
        const yearsToDisplay = endYearFromUrl ? parseInt(endYearFromUrl) : DEFAULT_YEARS;
        generateLifeChart(birthdateFromUrl, yearsToDisplay);
    } else {
        createEmptyGrid(DEFAULT_YEARS);
    }

    updateButton.addEventListener('click', function() {
        const birthdate = birthdateInput.value;
        const endYearValue = parseInt(endYearInput.value);
        const yearsToDisplay = !isNaN(endYearValue) && endYearValue > 0 ? endYearValue : DEFAULT_YEARS;
        
        if (birthdate) {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('birthdate', birthdate);
            newUrl.searchParams.set('endYear', yearsToDisplay);
            window.history.pushState({}, '', newUrl);
            generateLifeChart(birthdate, yearsToDisplay);
        } else {
            alert('Please enter a valid birthdate.');
        }
    });

    copyLinkButton.addEventListener('click', function() {
        const birthdate = birthdateInput.value;
        if (birthdate) {
            const url = new URL(window.location.href);
            url.searchParams.set('birthdate', birthdate);
            
            const endYearValue = parseInt(endYearInput.value);
            if (!isNaN(endYearValue) && endYearValue > 0) {
                url.searchParams.set('endYear', endYearValue);
            }
            
            navigator.clipboard.writeText(url.href)
                .then(() => alert('Link copied to clipboard!'))
                .catch(err => console.error('Failed to copy link: ', err));
        } else {
            alert('Please enter a birthdate first.');
        }
    });

    function createEmptyGrid(yearsToDisplay) {
        gridContainer.innerHTML = '';
        for (let year = 0; year < yearsToDisplay; year++) {
            const rowElement = document.createElement('div');
            rowElement.className = 'row';
            rowElement.setAttribute('data-year', year);

            const yearLabel = document.createElement('div');
            yearLabel.className = 'year-label';
            yearLabel.textContent = year; // Changed from year + 1 to year
            rowElement.appendChild(yearLabel); // Add label first

            const weeksPerRow = 53; // Max possible weeks for initial drawing
            for (let week = 0; week < weeksPerRow; week++) {
                const boxElement = document.createElement('div');
                boxElement.className = 'box';
                boxElement.setAttribute('data-week', week);
                rowElement.appendChild(boxElement);
            }
            gridContainer.appendChild(rowElement);
        }
    }

    function generateLifeChart(birthdateISO, yearsToDisplay) {
        gridContainer.innerHTML = ''; 

        const birthDate = dayjs(birthdateISO).utc().startOf('day');
        const currentDate = dayjs().utc().startOf('day');

        if (!birthDate.isValid() || birthDate.isAfter(currentDate)) {
            infoElement.textContent = "Please enter a valid past birthdate (YYYY-MM-DD).";
            createEmptyGrid(yearsToDisplay); 
            return;
        }

        // Log for debugging
        console.log("Birth date:", birthDate.format("YYYY-MM-DD"));
        console.log("Current date:", currentDate.format("YYYY-MM-DD"));

        // Function to calculate precise age in completed years
        function getCompletedYears(start, end) {
            // Calculate year difference (2025 - 1985 = 40)
            const yearDiff = end.year() - start.year();
            
            // Check if birthday has occurred this year:
            // If current month is less than birth month, or
            // If same month but current day is less than birth day
            const birthdayNotOccurredYet = end.month() < start.month() || 
                                       (end.month() === start.month() && 
                                        end.date() < start.date());
            
            // Subtract 1 year if birthday hasn't occurred yet this year
            const completedYears = birthdayNotOccurredYet ? yearDiff - 1 : yearDiff;
            
            console.log("Year difference:", yearDiff);
            console.log("Birthday hasn't occurred yet this year:", birthdayNotOccurredYet);
            console.log("Completed years:", completedYears);
            
            return completedYears;
        }

        const sundayOfBirthDateWeek = birthDate.weekday(0);
        
        // Calculate precise completed years of life
        const actualYearsLived = getCompletedYears(birthDate, currentDate);
        
        // Create array to store the boundary dates for each year of life
        const yearBoundaries = [];
        for (let yearIdx = 0; yearIdx <= yearsToDisplay; yearIdx++) {
            // The start of a "year of life" is the Sunday of the week of the anniversary
            // Make sure to create a new dayjs object for each calculation
            const anniversary = dayjs(birthDate).add(yearIdx, 'year');
            yearBoundaries.push(anniversary.weekday(0));
        }

        // Log first few boundaries for debugging
        console.log("Year boundaries (first 5):");
        for (let i = 0; i < Math.min(5, yearBoundaries.length); i++) {
            console.log(`Year ${i}: ${yearBoundaries[i].format("YYYY-MM-DD")}`);
        }

        for (let yearIdx = 0; yearIdx < yearsToDisplay; yearIdx++) {
            const rowElement = document.createElement('div');
            rowElement.className = 'row';
            rowElement.setAttribute('data-year', yearIdx);

            const yearLabel = document.createElement('div');
            yearLabel.className = 'year-label';
            yearLabel.textContent = yearIdx; // Changed from yearIdx + 1 to yearIdx
            rowElement.appendChild(yearLabel);

            // Use our precomputed boundaries to calculate weeks per row
            const startSundayForCurrentYear = yearBoundaries[yearIdx];
            const startSundayForNextYear = yearBoundaries[yearIdx + 1];

            let weeksInThisYearOfLife = startSundayForNextYear.diff(startSundayForCurrentYear, 'week');
            
            // Safety checks for week calculation
            if (weeksInThisYearOfLife < 51) weeksInThisYearOfLife = 52;
            if (weeksInThisYearOfLife > 53) weeksInThisYearOfLife = 53;

            for (let weekIdx = 0; weekIdx < weeksInThisYearOfLife; weekIdx++) {
                const boxElement = document.createElement('div');
                boxElement.className = 'box';
                boxElement.setAttribute('data-week', weekIdx);
                rowElement.appendChild(boxElement);
            }
            gridContainer.appendChild(rowElement);
        }
        
        const rows = gridContainer.querySelectorAll('.row');
        let weeksLivedCount = 0;

        // Helper function to find the correct year of life (row) for a given date
        function findYearOfLifeForDate(dateToCheck) {
            for (let yearIdx = 0; yearIdx < yearBoundaries.length - 1; yearIdx++) {
                if (dateToCheck.isSameOrAfter(yearBoundaries[yearIdx]) && 
                    dateToCheck.isBefore(yearBoundaries[yearIdx + 1])) {
                    return yearIdx;
                }
            }
            // If we're at or past the last boundary, return the last displayable year
            if (dateToCheck.isSameOrAfter(yearBoundaries[yearBoundaries.length - 1])) {
                return yearsToDisplay - 1;
            }
            return -1; // Before birth
        }

        // Log to verify the current Sunday is assigned to the right year of life
        const currentSunday = currentDate.weekday(0);
        console.log("Current Sunday:", currentSunday.format("YYYY-MM-DD"));
        console.log("Maps to year of life:", findYearOfLifeForDate(currentSunday));

        let currentIterSunday = dayjs(sundayOfBirthDateWeek);

        while(currentIterSunday.isSameOrBefore(currentDate.weekday(0))) { 
            const endOfWeekForIter = currentIterSunday.add(6, 'day');
            // Only skip weeks before birth
            const shouldFillThisWeek = birthDate.isSameOrBefore(endOfWeekForIter);

            if (shouldFillThisWeek) {
                const yearOfLife = findYearOfLifeForDate(currentIterSunday);

                if (yearOfLife !== -1) {
                    const startSunday = yearBoundaries[yearOfLife]; 
                    const weekInThisRow = currentIterSunday.diff(startSunday, 'week');

                    if (rows[yearOfLife]) {
                        const boxesInRow = rows[yearOfLife].querySelectorAll('.box');
                        if (weekInThisRow >= 0 && weekInThisRow < boxesInRow.length) {
                            boxesInRow[weekInThisRow].classList.add('filled');
                            weeksLivedCount++;
                        }
                    }
                }
            }
            currentIterSunday = currentIterSunday.add(1, 'week');
        }

        let nextBirthday = birthDate.year(currentDate.year());
        if (nextBirthday.isBefore(currentDate) || nextBirthday.isSame(currentDate, 'day')) {
            nextBirthday = nextBirthday.add(1, 'year');
        }
        
        let weeksUntilBirthdayCount = 0;
        let upcomingWeekIter = dayjs(currentDate).weekday(0); 
        
        if (currentIterSunday.isAfter(upcomingWeekIter)) {
             upcomingWeekIter = dayjs(currentIterSunday);
        }

        while(upcomingWeekIter.isBefore(nextBirthday)) {
            // Use our helper function for upcoming weeks too
            const yearOfLife = findYearOfLifeForDate(upcomingWeekIter);

            if (yearOfLife !== -1 && yearOfLife < yearsToDisplay) { 
                const weekOfYear = upcomingWeekIter.diff(yearBoundaries[yearOfLife], 'week');

                if (rows[yearOfLife]) { 
                    const boxesInRow = rows[yearOfLife].querySelectorAll('.box');
                    if (weekOfYear >= 0 && weekOfYear < boxesInRow.length) {
                        if (!boxesInRow[weekOfYear].classList.contains('filled')) {
                            boxesInRow[weekOfYear].classList.add('upcoming-birthday');
                            weeksUntilBirthdayCount++;
                        }
                    }
                }
            }
            upcomingWeekIter = upcomingWeekIter.add(1, 'week');
        }
        
        let textualWeeksUntilBirthday = 0;
        if (nextBirthday.isAfter(currentDate)) {
            textualWeeksUntilBirthday = nextBirthday.weekday(0).diff(currentDate.weekday(0), 'week');
            if (textualWeeksUntilBirthday < 0) textualWeeksUntilBirthday = 0;
        }
        
        // Use our precise age calculation rather than Day.js diff for the text
        let weeksInCurrentYearLivedText = 0;
        if (weeksLivedCount > 0) {
            // Make sure we're not accessing beyond array bounds
            const yearIndex = Math.min(actualYearsLived, yearBoundaries.length - 1);
            const startSundayOfCurrentAgeYear = yearBoundaries[yearIndex];
            const lastFilledOrCurrentSunday = dayjs.min(currentDate.weekday(0), currentIterSunday.subtract(1,'week'));

            if (lastFilledOrCurrentSunday.isSameOrAfter(startSundayOfCurrentAgeYear)) {
                 weeksInCurrentYearLivedText = lastFilledOrCurrentSunday.diff(startSundayOfCurrentAgeYear, 'week') + 1;
            }
            if (birthDate.isSame(currentDate, 'day')) weeksInCurrentYearLivedText = 1;
        }


        const formattedBirthDate = birthDate.format('MMMM D, YYYY');
        const formattedCurrentDate = currentDate.format('MMMM D, YYYY');
        const formattedNextBirthday = nextBirthday.format('MMMM D, YYYY');

        if (weeksLivedCount > 0) {
            infoElement.textContent = `As of ${formattedCurrentDate}, counting from the week of your birth (${formattedBirthDate}), you have lived ${actualYearsLived} full years and ${weeksInCurrentYearLivedText} weeks into your current year of life, totaling ${weeksLivedCount} weeks. ${textualWeeksUntilBirthday} weeks until your next birthday on ${formattedNextBirthday}.`;
        } else if (birthDate.isSameOrBefore(currentDate)) { // Born today or in the past, but chart might be empty if it's the very first day/week
             infoElement.textContent = `Born on ${formattedBirthDate}. Chart shows weeks starting from the Sunday of your birth week. ${textualWeeksUntilBirthday} weeks until your next birthday on ${formattedNextBirthday}.`;
        } else {
            infoElement.textContent = "Chart is for past birthdates.";
        }
    }
});

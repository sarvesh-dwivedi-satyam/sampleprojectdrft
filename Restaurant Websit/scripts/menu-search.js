(() => {
    const aliases = Object.freeze({
        chkn: 'chicken',
        chk: 'chicken',
        veg: 'vegetarian',
        nonveg: 'non vegetarian',
        bev: 'beverage',
        bevvies: 'beverage'
    });

    function normalize(value) {
        return String(value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('en')
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim()
            .replace(/\s+/g, ' ')
            .split(' ')
            .map((word) => {
                if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
                if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) return word.slice(0, -1);
                return word;
            })
            .join(' ');
    }

    function editDistance(left, right, limit) {
        if (Math.abs(left.length - right.length) > limit) return limit + 1;
        let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
        let current = new Array(right.length + 1);

        for (let row = 1; row <= left.length; row += 1) {
            current[0] = row;
            let minimum = current[0];
            for (let column = 1; column <= right.length; column += 1) {
                current[column] = Math.min(
                    current[column - 1] + 1,
                    previous[column] + 1,
                    previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1)
                );
                minimum = Math.min(minimum, current[column]);
            }
            if (minimum > limit) return limit + 1;
            [previous, current] = [current, previous];
        }
        return previous[right.length];
    }

    function createIndex(items) {
        const nameVocabulary = new Set();
        const detailVocabulary = new Set();
        const indexed = items.map((item) => {
            const name = normalize(item.name);
            const nameWords = name.split(' ');
            const categoryWords = normalize(item.category).split(' ');
            const subcategoryWords = normalize(item.subcategory || '').split(' ').filter(Boolean);
            const detailWords = normalize([
                item.description || '',
                item.keywords || '',
                ...(Array.isArray(item.ingredients) ? item.ingredients : [])
            ].join(' ')).split(' ').filter(Boolean);
            const dietWords = normalize(item.foodType || '').split(' ').filter(Boolean);
            const nameWordSet = new Set(nameWords);
            const detailWordSet = new Set([...categoryWords, ...subcategoryWords, ...detailWords, ...dietWords]);
            nameWords.forEach((word) => nameVocabulary.add(word));
            detailWordSet.forEach((word) => detailVocabulary.add(word));
            return { item, name, nameWords, nameWordSet, categoryWords, subcategoryWords, detailWords, dietWords, detailWordSet };
        });
        const fuzzyCache = new Map();

        function fuzzyCandidates(term) {
            if (fuzzyCache.has(term)) return fuzzyCache.get(term);
            const limit = term.length >= 7 ? 2 : 1;
            const matches = { names: [], details: [] };
            for (const word of nameVocabulary) {
                if (Math.abs(word.length - term.length) <= limit && editDistance(term, word, limit) <= limit) {
                    matches.names.push(word);
                }
            }
            for (const word of detailVocabulary) {
                if (Math.abs(word.length - term.length) <= limit && editDistance(term, word, limit) <= limit) {
                    matches.details.push(word);
                }
            }
            if (fuzzyCache.size >= 128) fuzzyCache.delete(fuzzyCache.keys().next().value);
            fuzzyCache.set(term, matches);
            return matches;
        }

        function search(query, filters = {}) {
            const normalizedQuery = normalize(String(query).trim().split(/\s+/)
                .map((word) => aliases[word.toLocaleLowerCase('en')] || word).join(' '));
            const terms = normalizedQuery.split(' ').filter(Boolean);
            const ranked = [];

            for (const entry of indexed) {
                const { item } = entry;
                if (filters.group && item.group !== filters.group) continue;
                if (filters.subcategory && item.subcategory !== filters.subcategory) continue;
                if (filters.foodType && item.foodType !== filters.foodType) continue;
                if (filters.vegan && item.vegan !== true) continue;
                if (filters.bestseller && item.bestseller !== true) continue;
                if (filters.availability && item.availability !== filters.availability) continue;
                if (Number.isFinite(filters.minPrice) && item.priceRupees < filters.minPrice) continue;
                if (Number.isFinite(filters.maxPrice) && item.priceRupees > filters.maxPrice) continue;

                let score = 0;
                if (normalizedQuery) {
                    if (entry.name === normalizedQuery) {
                        score = 1200;
                    } else if (entry.name.startsWith(normalizedQuery)) {
                        score = 1000;
                    } else if (entry.nameWords.some((word) => word.startsWith(normalizedQuery))) {
                        score = 900;
                    } else if (entry.name.includes(normalizedQuery)) {
                        score = 800;
                    } else {
                        let allTermsMatch = true;
                        for (const term of terms) {
                            let best = 0;
                            const fields = [
                                [entry.nameWords, 700, 500],
                                [entry.categoryWords, 560, 440],
                                [entry.subcategoryWords, 520, 400],
                                [entry.dietWords, 500, 380],
                                [entry.detailWords, 360, 280]
                            ];
                            for (const [words, prefixScore, containsScore] of fields) {
                                for (const word of words) {
                                    if (word.startsWith(term)) best = Math.max(best, prefixScore);
                                    else if (word.includes(term)) best = Math.max(best, containsScore);
                                }
                            }
                            if (!best && term.length >= 4) {
                                const candidates = fuzzyCandidates(term);
                                if (candidates.names.some((word) => entry.nameWordSet.has(word))) best = 220;
                                else if (candidates.details.some((word) => entry.detailWordSet.has(word))) best = 140;
                            }
                            if (!best) {
                                allTermsMatch = false;
                                break;
                            }
                            score += best;
                        }
                        if (!allTermsMatch) continue;
                    }
                }
                ranked.push({ item, score });
            }
            ranked.sort((left, right) => right.score - left.score || left.item.id.localeCompare(right.item.id));
            return ranked;
        }

        function expandAlias(query) {
            return String(query).trim().split(/\s+/).map((word) => aliases[word.toLocaleLowerCase('en')] || word).join(' ');
        }

        return Object.freeze({ search, normalize, expandAlias });
    }

    window.MidnightMenuSearch = Object.freeze({ createIndex, normalize, editDistance });
})();

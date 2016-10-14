import _filesize from 'filesize';
import moment from 'moment';

//eh, its a web page whats the chance it hasn't been reloaded in 30days.
const MONTH_AGO = Date.now() - (30 * 24 * 60 * 10000);
const YEAR_AGO = Date.now() - (MONTH_AGO * 12);

export const filesize = _filesize;

export const datetime = (time)=> {
	const date = moment(time);
	if (date.unix() < MONTH_AGO) {
		return date.fromNow(); // "3 hours ago"
	}
	if (date.unix() < YEAR_AGO) {
		return date.format("MMM D"); // "Dec 6"
	}
	return date.format("MMM D, YYYY"); // "Dec 6, 2015"
	
};

const TIME = ((s = 1000, m, h, d, w, y)=>({
	ms: 0,
	s,
	m: (m = 60 * s),
	h: (h = 60 * m),
	d: (d = 24 * h),
	w: (w = 7 * d),
	y: (y = 365 * d)
}))();

export const timeunit = (val, def = 'd')=> {
	if (!val) return [0, def];
	for (const unit of ['y', 'd', 'h', 'm', 's']) {
		if (val > TIME[unit]) {
			return [Math.round(val * 10 / TIME[unit]) / 10, unit];
		}
	}
	return [0, 'd'];
};
export default ({
	filesize,
	datetime,
	timeunit
});

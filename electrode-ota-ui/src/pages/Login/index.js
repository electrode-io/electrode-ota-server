import Login from "./Login";
import { connect } from "react-redux";
import boundDispatched from "../../util/boundDispatched";
import { login } from "./actions";
import { navigate, loginReset } from "../Shell/actions";

const mapStateToProps = (
	{ authorization: { host, token, isError, error, hostname, hideHost } },
	props
) => {
	return {
		value: { host, token, hostname, hideHost },
		isError: isError || error != null,
		error
	};
};

const mapDispatchToProps = (dispatch, { location = {} }) => ({
	onSubmit({ host, token, remember } = {}) {
		if (!(host && token)) {
			return;
		}
		dispatch(login(host, token)).then(({ value }) => {
			if (!value) {
				return value;
			}
			if (remember) {
				sessionStorage.token = token || "";
				sessionStorage.host = host || "";
			}
			dispatch(loginReset());
			if (location.state && location.state.nextPathname) {
				dispatch(navigate(location.state.nextPathname));
			} else {
				dispatch(navigate("/"));
			}
		});
	}
});

export default connect(
	mapStateToProps,
	mapDispatchToProps,
	boundDispatched
)(Login);

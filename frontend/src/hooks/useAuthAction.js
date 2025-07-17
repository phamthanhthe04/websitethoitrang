import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

const useAuthAction = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  const requireAuth = (action, showToast = true) => {
    if (!isAuthenticated) {
      if (showToast) {
        toast.warning('Vui lòng đăng nhập để thực hiện chức năng này!');
      }
      navigate('/dang-nhap', {
        state: { from: location },
        replace: false,
      });
      return false;
    }

    // Execute the action if authenticated
    if (typeof action === 'function') {
      action();
    }
    return true;
  };

  return {
    isAuthenticated,
    requireAuth,
  };
};

export default useAuthAction;

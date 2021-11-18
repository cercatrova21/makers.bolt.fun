import { motion } from 'framer-motion'
import { Direction, ModalId, replaceModal } from '../../redux/features/modals.slice';
import { useAppDispatch } from '../../utils/hooks';
import { ModalCard, modalCardVariants } from '../Shared/ModalsContainer/ModalsContainer'
import { IoLockClosed, } from 'react-icons/io5'
import { useEffect } from 'react';

export default function LoginSuccessCard({ onClose, direction, ...props }: ModalCard) {

    const dispatch = useAppDispatch();

    const handleNext = () => {
        dispatch(replaceModal({
            modalId: ModalId.LoginScanWallet,
            direction: Direction.NEXT
        }))
    }


    useEffect(() => {
        // const timeout = setTimeout(handleNext, 3000)
        // return () => clearTimeout(timeout)
    }, [handleNext])

    return (
        <motion.div
            custom={direction}
            variants={modalCardVariants}
            initial='initial'
            animate="animate"
            exit='exit'
            className="modal-card max-w-[343px] p-24 rounded-xl relative"

        >
            <h2 className='text-h5 font-bold'>Login success</h2>

            <div className="flex justify-center mt-32">
                <img
                    src="/assets/icons/success-icon.svg"
                    className='w-80 h-80'
                    alt="success" />
            </div>
            <p className="text-body4 text-center mt-32">
                Welcome <span className="font-bold">bc104NhPs...2oGnSKTs</span>
            </p>


        </motion.div>
    )
}
